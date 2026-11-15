//
//  ViewController.swift
//  Stylebot
//
//  Created by Ankit Ahuja on 11/1/26.
//

import UIKit
import WebKit

struct ExtensionMessage: Decodable {
    let message: String
}

/**
 * The extension's messages in the user's language, with English for any it lacks,
 * read from the _locales folder bundled with the extension.
 */
func extensionMessages() -> [String: String] {
    guard let localesURL = Bundle.main.builtInPlugInsURL?
            .appendingPathComponent("Stylebot Extension.appex/_locales"),
          let locales = try? FileManager.default.contentsOfDirectory(atPath: localesURL.path) else {
        return [:]
    }

    let locale = Bundle.preferredLocalizations(from: locales).first ?? "en"

    return ["en", locale].reduce(into: [:]) { messages, locale in
        let url = localesURL.appendingPathComponent("\(locale)/messages.json")

        guard let data = try? Data(contentsOf: url),
              let localeMessages = try? JSONDecoder().decode([String: ExtensionMessage].self, from: data) else {
            return
        }

        for (key, value) in localeMessages {
            messages[key] = value.message
        }
    }
}

class ViewController: UIViewController, WKNavigationDelegate {

    @IBOutlet var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        self.webView.navigationDelegate = self
        self.webView.isOpaque = false
        self.webView.scrollView.contentInsetAdjustmentBehavior = .never
        self.webView.scrollView.alwaysBounceVertical = false

        // Safari puts Manage Extensions in a different place on iPhone and iPad.
        if UIDevice.current.userInterfaceIdiom == .phone {
            let script = WKUserScript(
                source: "document.documentElement.classList.add('phone')",
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
            self.webView.configuration.userContentController.addUserScript(script)
        }

        self.webView.loadFileURL(Bundle.main.url(forResource: "Main", withExtension: "html")!, allowingReadAccessTo: Bundle.main.resourceURL!)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.callAsyncJavaScript(
            "localize(messages)",
            arguments: ["messages": extensionMessages()],
            in: nil,
            in: .page
        )
    }

    /**
     * Opens the page's links in Safari; the page itself only ever loads its
     * bundled file.
     */
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url, !url.isFileURL else {
            decisionHandler(.allow)
            return
        }

        decisionHandler(.cancel)

        if url.scheme == "https" {
            UIApplication.shared.open(url)
        }
    }

}
