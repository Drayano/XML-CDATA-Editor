# XML CDATA Editor

This is a simple TypeScript extension that allows you to easily edit code written inside CDATA tags in an XML file, it does that by simply copying the content of CDATA tags inside an opened XML file and opening that content in a side-by-side tab, the content of the two files is then kept in sync so that you can easily write code in the dedicated type with full VSCode capabilities, such as syntax highlighting, code completion and other features that wouldn't be available when trying to write code inside the CDATA tag directly.

As a bonus the extension also handles sync when editing the CDATA tag inside the XML file.

# Planned features

- Handle XML files with multiple CDATA tags : right now support for such files is broken and doesn't work, I plan on working on such a feature very soon

- Allow for the code to be opened on the left side and the XML file to be switched on the right side as it would be more convenient (for me personally, I plan on keeping the current layout as an option too)

- Allow for more languages support : theoretically this should work for any language, however right now it's hard-coded to work with JavaScript only, I plan on making this a customizable feature as either an option or an auto-detect.

# Why this extension ?

I wrote this mostly for myself to use, as I found myself having to edit and maintain JavaScript code written inside CDATA tags inside XML files (yeah), so in order to make it easier to maintain such files I developed this extension as I couldn't find an already existing one.