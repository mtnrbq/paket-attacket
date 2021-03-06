/**
 * All of the items in the NugetFunctionality namespace indicate that the functions come from the Nuget Gallery JavaScript.
 * At the time of this code, those files were in the "feature-redesign" branch.
 * I've tweaked it as necessary to include other references to the namespace and to modify the copy clipboard text functionality
 * to take in a transformation function.
 */
var NugetFunctionality = {
  FillTabTemplate : function(id, label){
    return '<li role="presentation" class="">'+
          '<a href="#' + id + '" aria-expanded="false"'+
            'aria-selected="false"'+
            'aria-controls="' + id +'" role="tab" data-toggle="tab"'+
            'title="Switch to tab panel which contains package installation command for ' + label + '">'+
              label + 
          '</a>'+
        '</li>';
  },

  FillPanelTemplate : function(id, label){
    return     '<div role="tabpanel" class="tab-pane" id="' + id + '">' + 
                '<div>' + 
                  '<div class="install-script" id="' + id + '-text">' + 
                    '<span>' + 
                      '{{TOKEN}}' + 
                    '</span>' + 
                  '</div>' + 
                  '<div class="copy-button">' + 
                    '<button id="' + id + '-button" class="btn btn-default btn-warning" type="button"' + 
                      'data-toggle="popover" data-placement="bottom" data-content="Copied."' + 
                      'aria-label="Copy the ' + label + ' command">' + 
                      '<span class="ms-Icon ms-Icon--Copy" aria-hidden="true"></span>' + 
                    '</button>' + 
                  '</div>' + 
                '</div>' + 
              '</div>'; 
  },

  DetectIE : function() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    // other browser or edge
    return false;
  },

  CopyTextToClipboard : function (text, elementToFocus) {
    if (NugetFunctionality.DetectIE()) {
      try {
          window.clipboardData.setData('Text', text);
          console.log('Copying text command via IE-setData');
      } catch (err) {
          console.log('Oops, unable to copy via IE-setData');
      }
    }
    else {

      var textArea = document.createElement("textarea");

      //
      //  This styling is an extra step which is likely not required. 
      //
      // Why is it here? To ensure:
      // 1. the element is able to have focus and selection.
      // 2. if element was to flash render it has minimal visual impact.
      // 3. less flakyness with selection and copying which might occur if
      //    the textarea element is not visible.
      //
      // The likelihood is the element won't even render, not even a flash,
      // so some of these are just precautions. 
      // 
      // However in IE the element
      // is visible whilst the popup box asking the user for permission for
      // the web page to copy to the clipboard. To prevent this, we are using 
      // the detectIE workaround.

      // Place in top-left corner of screen regardless of scroll position.
      textArea.style.position = 'fixed';
      textArea.style.top = 0;
      textArea.style.left = 0;

      // Ensure it has a small width and height. Setting to 1px / 1em
      // doesn't work as this gives a negative w/h on some browsers.
      textArea.style.width = '2em';
      textArea.style.height = '2em';

      // We don't need padding, reducing the size if it does flash render.
      textArea.style.padding = 0;

      // Clean up any borders.
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';

      // Avoid flash of white box if rendered for any reason.
      textArea.style.background = 'transparent';


      textArea.value = text;

      document.body.appendChild(textArea);

      textArea.select();

      try {
          var successful = document.execCommand('copy');
          var msg = successful ? 'successful' : 'unsuccessful';
          console.log('Copying text command was ' + msg);
      } catch (err) {
          console.log('Oops, unable to copy');
      }

      document.body.removeChild(textArea);

      // Focus the element provided so that tab order is not reset to the beginning of the page.
      if (elementToFocus) {
          elementToFocus.focus();
      }
    }
  },

  ConfigureCopyButton : function (id, textTransformationFunction) {
    var copyButton = $('#' + id + '-button');
    copyButton.popover({ trigger: 'manual' });

    copyButton.click(function () {
      var text = $('#' + id + '-text').text();

      var textToCopy = textTransformationFunction(text);
      NugetFunctionality.CopyTextToClipboard(textToCopy, copyButton);
      copyButton.popover('show');
      setTimeout(function () {
          copyButton.popover('destroy');
      }, 1000);
    });
  }
};

/**
 * Each "spec" (for lack of a better word) needs to specify an ID and label, as well as two functions:
 *  1) to take nuget-formatted text and modify it to be the text of the spec (for display)
 *  2) to take the displayed text and format it for the clipboard
 */
var Specs = {
  PaketSpec : {
    label: 'Paket CLI',
    id: 'paket-cli',
    packageTextReplacement: function(packageTextFormattedForNuget){
      var formattedPackageText = packageTextFormattedForNuget.replace("Install-Package", "> paket add");
      formattedPackageText = formattedPackageText.replace("-Version", "--version");

      return formattedPackageText;
    },
    clipboardTextReplacement: function(clipboardTextFormattedForPaket){
      return clipboardTextFormattedForPaket.replace(">", "").trim();
    }
  }
};

var specs = [Specs.PaketSpec];

function fireContentLoadedEvent () {
  var nugetFormattedPackageText = $("#package-manager-text > span").text();
  var tabList = $("ul.nav-tabs");
  var tabContents = $("div.tab-content");

  $.each(specs, function(index, spec){
    var tab = NugetFunctionality.FillTabTemplate(spec.id, spec.label);
    var panel = NugetFunctionality.FillPanelTemplate(spec.id, spec.label);

    var formattedPackageText = spec.packageTextReplacement(nugetFormattedPackageText);
    var filledTemplate = panel.replace("{{TOKEN}}", formattedPackageText);
 
    tabList.append(tab);
    tabContents.append(filledTemplate);
  
    NugetFunctionality.ConfigureCopyButton(spec.id, spec.clipboardTextReplacement);
  });
 
}

document.addEventListener('DOMContentLoaded', fireContentLoadedEvent, false);
