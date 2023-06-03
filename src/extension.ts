// @ts-nocheck
import * as vscode from 'vscode';

let cdataEditor: vscode.TextEditor | undefined;
let xmlEditor: vscode.TextEditor | undefined;

let cdataFile: vscode.TextDocument | undefined;
let xmlFile: vscode.TextDocument | undefined;

export function activate(context: vscode.ExtensionContext) {
  // Register an event handler for when an XML file is opened.
  let disposable = vscode.workspace.onDidOpenTextDocument((document: vscode.TextDocument) => {
    // Check if the opened file has an XML language ID.
    if (document.languageId === 'xml') {
      // Get the text content of the XML file.
      const xmlContent = document.getText();
      xmlFile = document;
      xmlEditor = vscode.window.activeTextEditor;

      // Extract the content inside CDATA tags.
      const cdataContent = extractCDataContent(xmlContent);

      // Analyze and highlight the JavaScript code.
      openInNewWindow(cdataContent);

      // Store a reference to the CDATA editor.
      cdataEditor = vscode.window.activeTextEditor;

      // Register an event handler for text changes in the CDATA editor.
      const cdataDisposable = vscode.workspace.onDidChangeTextDocument(
        async (event: vscode.TextDocumentChangeEvent) => {
          if (event.document === cdataFile) {
            // Retrieve the modified CDATA content.
            const modifiedCdataContent = event.document.getText();

            // Update the XML document with the modified CDATA content.
            const updatedXmlContent = getUpdatedXMLContent(xmlFile!.getText(), modifiedCdataContent);

            // Apply the changes to the XML file.
            const edit = new vscode.WorkspaceEdit();
            edit.replace(xmlFile!.uri, new vscode.Range(0, 0, xmlFile!.lineCount, 0), updatedXmlContent);
            await vscode.workspace.applyEdit(edit);
          }
        }
      );

      // Register an event handler for text changes in the XML editor.
      const xmlDisposable = vscode.workspace.onDidChangeTextDocument(
        async (event: vscode.TextDocumentChangeEvent) => {
          if (event.document === xmlFile) {
            // Retrieve the modified XML content.
            const modifiedXmlContent = event.document.getText();
            const modifiedCdataContent = extractCDataContent(modifiedXmlContent);

            // Update the CDATA document with the modified XML content.
            const edit = new vscode.WorkspaceEdit();
            edit.replace(cdataFile!.uri, new vscode.Range(0, 0, cdataFile!.lineCount, 0), modifiedCdataContent);
            await vscode.workspace.applyEdit(edit);
          }
        }
      );

      context.subscriptions.push(cdataDisposable, xmlDisposable);
    }
  });

  // Register an event handler for when a text document is closed.
  let closeDisposable = vscode.workspace.onDidCloseTextDocument((document: vscode.TextDocument) => {
    if (document === cdataFile) {
      if (cdataEditor) {
        cdataEditor.hide();
        cdataEditor = undefined;
      }
      cdataFile = undefined;
    } else if (document === xmlFile) {
      if (cdataEditor) {
        cdataEditor.hide();
        cdataEditor = undefined;
      }
      xmlEditor = undefined;
      xmlFile = undefined;
    }
  });

  context.subscriptions.push(disposable, closeDisposable);
}

// Function to extract content inside CDATA tags using regex.
function extractCDataContent(xmlContent: string): string {
  const regex = /<!\[CDATA\[(.*?)]]>/gs;
  const matches = xmlContent.match(regex);

  if (matches && matches.length > 0) {
    // Remove the CDATA tags from each match.
    const cdataContent = matches.map((match) => match.replace(/<!\[CDATA\[|\]\]>/g, '')).join('');
    return cdataContent;
  }

  return '';
}

async function openInNewWindow(code: string) {
  const languageId = 'javascript';

  const userChoice = await vscode.window.showInformationMessage(
    'Do you want to open the CDATA content in a new side-by-side file?',
    { modal: false },
    'Yes',
    'No'
  );

  if (userChoice === 'Yes') {
    const document = await vscode.workspace.openTextDocument({
      language: languageId,
      content: code,
    });

    const editor = await vscode.window.showTextDocument(document, {
      preserveFocus: true,
      viewColumn: vscode.ViewColumn.Two,
    });

    // Change the document language to JavaScript
    await vscode.languages.setTextDocumentLanguage(editor.document, languageId);

    cdataEditor = editor;
    cdataFile = document;
  }
}

// Function to get the new XML document content with modified CDATA content.
function getUpdatedXMLContent(xmlContent: string, cdataContent: string): string {
  return xmlContent.replace(/<!\[CDATA\[(.*?)]]>/gs, `<![CDATA[${cdataContent}]]>`);
}

// This method is called when the extension is deactivated.
export function deactivate() {
  // Clean up any resources used by the extension.
  // This method is called when the user deactivates the extension or
  // when Visual Studio Code is shutting down.
}
