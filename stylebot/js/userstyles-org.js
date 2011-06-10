window.addEventListener('load', function() {
    addInstallLink();
}, false);

function addInstallLink() {
    // link
    var a = document.createElement('a');
    a.innerHTML = 'Click to add to Stylebot';
    a.className = 'stylebot-link';
    a.href = '#';
    a.style.color = '#fbfbfb';
    a.style.fontSize = '18px';
    a.style.display = 'block';
    a.style.marginTop = '20px';
    a.addEventListener('click', install, false);

    // description
    var desc = document.createElement('div');
    desc.style.color = '#eee';
    desc.style.fontSize = '12px';
    desc.style.fontStyle = 'italic';
    desc.innerHTML = "( very experimental! if it doesn't work, you may need to copy code manually )";

    document.getElementById('install').appendChild(a);
    document.getElementById('install').appendChild(desc);
}

function install() {
    var name = document.getElementById('stylish-description').innerText;
    if (confirm("Add '" + name + "' to Stylebot ? \n\nIt will replace any existing stylebot CSS for the affected URLs."))
    {
        var xhr = new XMLHttpRequest();
        var url = document.querySelector("link[rel='stylish-code-chrome']").getAttribute('href');
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                save(xhr.responseText);
            }
        }
        xhr.send();
    }
}

function save(response) {
    // console.log(response);
    var json = JSON.parse(response);

    var saveCodeBlock = function(block) {
        var rules = CSSUtils.parseCSS(block.code);
        var len = block.domains.length;
        var locations = block.domains;
        if (len == 0)
        {
            len = block.urls.length;
            locations = block.urls;
        }
        for (var i = 0; i < len; i++) {
            chrome.extension.sendRequest({name: 'save', url: locations[i], rules: rules}, function(response) {
            });
        }
    }

    if (json.code)
        saveCodeBlock(json);

    else {
        var len = json.sections.length;
        for (var i = 0; i < len; i++) {
            if (json.sections[i].code)
            {
                saveCodeBlock(json.sections[i]);
            }
        }
    }
}
