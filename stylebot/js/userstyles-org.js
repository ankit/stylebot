window.addEventListener('load', function() {
    addInstallLink();
}, false);

function addInstallLink() {
    // todo: inject a style element instead of all this clumsiness :)
    var span = document.createElement('span');
    span.style.background = '-webkit-gradient(linear, left top, left bottom, from(#eee), to(#bdbdbd))';
    span.style.padding = '10px';
    span.style.display = 'block';
    span.style.borderRadius = '5px';
    span.style.width = '385px';
    span.style.marginTop = '10px';

    // link
    var a = document.createElement('a');
    a.innerHTML = 'Click to install in Stylebot';
    a.className = 'stylebot-link';
    a.href = '#';
    a.id = 'stylebot_installation_status';
    a.style.color = '#333';
    a.style.fontSize = '16px';
    a.style.textDecoration = 'none';
    a.style.fontFamily = '\'Lucida Grande\', Tahoma, Arial, sans-serif';
    a.addEventListener('click', install, false);
    a.addEventListener('mouseover', function(e) {
        e.target.style.textDecoration = 'underline';
    }, false);
    a.addEventListener('mouseout', function(e) {
        e.target.style.textDecoration = 'none';
    }, false);

    // description
    var desc = document.createElement('div');
    desc.style.color = '#444';
    desc.style.fontSize = '10px';
    desc.style.marginTop = '10px';
    desc.innerHTML = "<strong>Warning</strong>: This is very experimental. It may replace any existing styles you have installed for the URLs belonging to this style. <br><br>If it doesn't work, try and to copy -> paste the CSS manually.";

    span.appendChild(a);
    span.appendChild(desc);
    document.getElementById('style-info').appendChild(span);
}

function install(e) {
    e.preventDefault();
    e.stopPropagation();
    var name = document.getElementById('stylish-description').innerText;
    var xhr = new XMLHttpRequest();
    var url = document.querySelector("link[rel='stylish-code-chrome']").getAttribute('href');
    xhr.open('GET', url, true);
    document.getElementById('stylebot_installation_status').innerHTML = 'Installing...';
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            save(xhr.responseText);
        }
    }
    xhr.send();
}

function save(response) {
    try {
        var json = JSON.parse(response);

        var saveCodeBlock = function(block) {
            var parser = new CSSParser();
            var sheet = parser.parse(block.code, false, true);
            var rules = CSSUtils.getRulesFromParserObject(sheet);
            var locations;
            if (block.domains.length != 0)
                locations = block.domains;
            else if (block.urls.length != 0)
                locations = block.urls;
            else if (block.urlPrefixes.length != 0)
                locations = block.urlPrefixes;

            console.log(block);
            chrome.extension.sendRequest({
                name: 'save',
                url: locations.join(','),
                rules: rules
            }, function(response) {});
            document.getElementById('stylebot_installation_status').innerHTML = 'Style installed!';
        }

        if (json.code)
            saveCodeBlock(json);
        else {
            var len = json.sections.length;
            for (var i = 0; i < len; i++) {
                if (json.sections[i].code)
                    saveCodeBlock(json.sections[i]);
            }
        }
    }
    catch(e) {
        document.getElementById('stylebot_installation_status').innerHTML = 'Error: ' + e;
        console.log(e);
    }
}
