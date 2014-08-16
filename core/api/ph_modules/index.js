var webpage = require('webpage'),
    page = webpage.create(),

    fs = require('fs'),
    system = require('system');

//var parser = require('./parser').parser;
//var test = require('./test');

// arguments from node query
var url = system.args[1],
    id = system.args[2];

console.log();

page.onConsoleMessage = function(msg) {
//    console.log('-- webkit console: ' + msg);
};

page.open('http://127.0.0.1:8080/'+ url, function (status) {
    if (status !== 'success') {
        console.log('Сервер не отвечает.');
        phantom.exit();
    }

   setTimeout(function () {

       var code = page.evaluate(function (url) {

// -----
           var config = {
                   // include params from opt@argument first
                   code: 'source_example',
                   h2: 'source_section_h',
                   h3: 'H3',
                   h4: 'H4',
                   timeout: 3000
               },

               _h2 = 0, _h3 = 0, _h4 = 0,

               specData = [],
               sections,
               elem,
               prevFlag,
               root = false
               ;

// add attemps limit
           function getSections() {
               sections = [].slice.call(document.getElementsByClassName(config.h2));

               /* If specs arent ready, trying again after 200ms */
               if (sections[0]) {
                   for (var i = 0, l = sections.length; i < l; i++) {
                       elem = sections[i];
                       specData.push(parse(elem));
                   }

                   return JSON.stringify(specData);
               }
               else {
                   return 'Ошибка в парсинге спецификации: '+ url;
console.log('--! setTimeout');
                   setTimeout(getSections, 200);
               }
           }

           function parse(section) {
               _h2++;
               _h3 = 0;
               _h4 = 0;

               return new Spec(section);
           }

           function Spec(section) {
               if (section.next){
                   elem = (elem)? elem.nextElementSibling : null;
               }

               console.log('Spec starts...#level', elem);

               // this.html = getHTML(elem); // @Array with code
               // this.ID = returnId();
               this.header = section.header || getHeader(elem);
               this.nested = [];

               while (elem) {
                   if (root) {
                       elem = elem.previousElementSibling;
                       root = false;
                       break;
                   }

                   var
                       tag = elem.tagName,
                       cls = elem.className,
                       flag = checkElem(tag, cls)
                       ;

                   if (flag === 'H2') {
                       this.header = getHeader(elem);
                       prevFlag = flag;
                   }
                   else if (flag === 'CODE') {
                       this.html = getHTML(elem);
                   }
                   else if (flag === 'H3') {
                       if (prevFlag == 'H4') {
                           root = true;
                       }

                       if (prevFlag == 'H3' || prevFlag == 'H4') {
                           prevFlag = null;
                           elem = elem.previousElementSibling;
                           break;
                       }
                       _h3++;
                       _h4 = 0;
                       prevFlag = flag;
                       this.nested.push(new Spec({header: getHeader(elem), next: true}));
                   }
                   else if (flag === 'H4') {
                       if (prevFlag == flag) {
                           prevFlag = null;
                           elem = elem.previousElementSibling;
                           break;
                       }
                       _h4++;
                       prevFlag = flag;
                       this.nested.push(new Spec({header: getHeader(elem), next: true}))
                   }

                   if (elem) elem = elem.nextElementSibling;
               }

           }

// HELPERS
           function returnId() {
               return [_h2, _h3, _h4].join('.');
           }

           function getHeader(elem) {
               return elem.innerText || 'API: cannot get header.';
           }

           function getHTML(elem) {
               return elem.innerHTML;
           }

           function checkElem(tag, cls) {
               return isH2(tag, cls) || isH3(tag, cls) || isH4(tag, cls) || isCode(tag, cls);
           }

           function isH2(tag, cls) {
               return (tag == 'H2' && cls.match(RegExp('\\b'+ config.h2 + '\\b')))? 'H2' : false;
           }

           function isH3(tag, cls) {
               return (tag == 'H3')? 'H3' : false;
           }

           function isH4(tag, cls) {
               return (tag == 'H4')? 'H4': false;
           }

           function isCode(tag, cls) {
               return (tag == 'SECTION' && cls.match(RegExp('\\b'+ config.code + '\\b')))? 'CODE' : false;
           }



           /* Start parser */
           return getSections();
// -----


       }, url);

       console.log(code);

   }, 1000);


    setTimeout(function () {
        phantom.exit();
    }, 1000)

});



page.onError = function(msg, trace) {
//    console.log('--- error: '+ url +' ---\nph_modules/output.txt', 'Error: '+ msg + '\nFile: '+ trace[0].file +'\nLine: '+ trace[0].line +'\nFunc: '+ trace[0].function + '\n--- /error ---');

    var file = url.split('/').join('-');

    // dont append just rewrite :(
    fs.write('ph_modules/log/output_'+ file +'.txt', 'Error: '+ msg + '\nFile: '+ trace[0].file +'\nLine: '+ trace[0].line +'\nFunc: '+ trace[0].function);
}


