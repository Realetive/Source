'use strict';

var path = require('path');
var marked = require('marked');
var cheerio = require('cheerio');
var deepExtend = require('deep-extend');
var translit = require(path.join(global.pathToApp,'core/lib/translit'));

var renderer = new marked.Renderer();

// Module configuration
var globalConfig = global.opts.core && global.opts.core.processMd ? global.opts.core.processMd : {};
var config = {
    espaceCodeHTML: true,
    languageRenderers: {
        example: function (code) {
            return '<div class="source_example">' + code + '</div>';
        }
    },

    // Define marked module options
    marked: {}
};
// Overwriting base options
deepExtend(config, globalConfig);

// Processing with native markdown renderer
renderer.code = function (code, language) {
    if (config.languageRenderers.hasOwnProperty(language)) {
        return config.languageRenderers[language](code);
    } else {
        if (config.espaceCodeHTML) code = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        if (language && language !== '') {
            return '<code class="src-' + language + ' source_visible">' + code + '</code>';
        } else {
            return '<pre><code class="lang-source_wide-code">' + code + '</code></pre>';
        }
    }
};

renderer.heading = function (text, level) {
    var escapedText = translit(text);

    return '<h' + level + ' id="' + escapedText + '">' + text + '</h' + level + '>';
};

// Extend re-defined renderer
config.marked.renderer = deepExtend(renderer, config.marked.renderer);

marked.setOptions(config.marked);

module.exports = function (markdown) {
    var $ = cheerio.load('<div id="content">' + marked(markdown) + '</div>');
    var $content = $('#content').first();

    // Spec description
    var $startElement;
    var $H1 = $content.children('h1').first();

    if ($H1.length > 0) {
        $startElement = $H1;
    } else {
        $content.prepend('<div id="sourcejs-start-element"></div>');
        $startElement = $content.children('#sourcejs-start-element').first();
    }

    var $description = $startElement.nextUntil('h2');
    $description.remove();
    $startElement.after('<div class="source_info">' + $description + '</div>');
    $content.children('#sourcejs-start-element').first().remove();

    // Spec sections
    $content.children('h2').each(function () {
        var $this = $(this);
        var $filteredElems = $('');

        var $sectionElems = $this.nextUntil('h2');
        var id = $this.attr('id');
        $this.removeAttr('id');

        // Adding additional check, since cheerio .nextUntil is not stable
        $sectionElems.each(function () {
            if (this.tagName === 'h2') return false;

            $filteredElems = $filteredElems.add(this);
        });

        $filteredElems.remove();

        $(this).replaceWith([
            '<div class="source_section" id="' + id + '">',
            $this + $filteredElems,
            '</div>'
        ].join(''));
    });

    return $content.html();
};