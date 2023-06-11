# XML CDATA Editor

This is a simple Visual Studio Code extension written in TypeScript that allows you to easily edit code written inside CDATA tags in an XML file, it does that by simply copying the content of CDATA tags inside XML file when opened and pasting that content in a new side-by-side tab, the content of the two files is then kept in sync so that you can easily write code in the dedicated tab with full Visual Studio Code capabilities, such as syntax highlighting, code completion and other features that wouldn't be available when trying to write code inside the CDATA tag directly.

# Planned features

-   Close the associated CDATA files when closing the XML file

-   Add test units to make sure I don't break anything else when making changes

-   Other features as I need them (nothing particularly comes to mind right now)

# Cancelled features

-   Syncing changes from the XML file back to the CDATA files : I've had this features on earlier versions of the extension, it broke when refactoring some features and I didn't feel like adding it back since it would need some non-trivial refactoring and I don't see too much point in such a feature

# Why this extension ?

I wrote this mostly for myself to use, as I found myself having to edit and maintain JavaScript code written inside CDATA tags inside XML files (yeah), so in order to make it easier to maintain such files I developed this extension as I couldn't find an already existing one.

# Extension settings

The extension has a few settings that you can edit inside Visual Studio Code (simply open the settings tab and search for XML CDATA Editor) :

-   programmingLanguage : The programming language to use for the extension. This is the language that newly opened file will be set as. (Default is javascript).

-   programmingLanguageExtension : The file extension to use for the newly opened files. (Default is js).

-   cdataPosition : The side you want the CDATA files content to open relative to the XML file (Left or Right). (Default is left).

-   updateDelay : Delay before syncing the changes of the CDATA files back to the XML file (in milliseconds). Keep in mind that a low enough value will trigger repetitive flashing for each keystroke. (You'll probably have to re-open the XML and CDATA files for this change to take effect). (Default is 1500).

-   openDelay : Delay before opening the CDATA files (in milliseconds). Keep in mind that a low enough value might cause issues if there's multiple/big CDATA tags and you have linters that will take time to check each file. (Default is 500).
