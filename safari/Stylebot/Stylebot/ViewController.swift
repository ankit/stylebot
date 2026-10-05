//
//  ViewController.swift
//  Stylebot
//
//  Created by Ankit Ahuja on 9/25/26.
//

import Cocoa
import SafariServices
import WebKit

let extensionBundleIdentifier = "dev.stylebot.mac.Extension"

struct ExtensionMessage: Decodable {
    let message: String
}

/**
 * The extension's messages in the user's language, with English for any it lacks,
 * read from the _locales folder bundled with the extension.
 */
func extensionMessages() -> [String: String] {
    guard let localesURL = Bundle.main.builtInPlugInsURL?
            .appendingPathComponent("Stylebot Extension.appex/Contents/Resources/_locales"),
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

class ViewController: NSViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        self.webView.navigationDelegate = self

        self.webView.configuration.userContentController.add(self, name: "controller")

        self.webView.loadFileURL(Bundle.main.url(forResource: "Main", withExtension: "html")!, allowingReadAccessTo: Bundle.main.resourceURL!)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        let messages = extensionMessages()

        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            let enabledState = state.map { $0.isEnabled ? "on" : "off" } ?? "unknown"

            DispatchQueue.main.async {
                webView.callAsyncJavaScript(
                    "show(state, messages)",
                    arguments: ["state": enabledState, "messages": messages],
                    in: nil,
                    in: .page
                )
            }
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if (message.body as! String != "open-preferences") {
            return;
        }

        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            DispatchQueue.main.async {
                NSApplication.shared.terminate(nil)
            }
        }
    }

}
