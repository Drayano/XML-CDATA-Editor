import * as vscode from "vscode";
import * as path from "path";
import * as xmlUtilities from "./xmlUtilities";
import { getSettings } from "./settings";

let xmlFile: vscode.TextDocument | undefined;
const cdataFiles: { [key: string]: vscode.TextDocument } = {}; // Map to store CDATA files

export function activate(context: vscode.ExtensionContext): void {
	let settings = getSettings();

	vscode.workspace.onDidChangeConfiguration(() => {
		// Update the settings
		settings = getSettings();
	});

	// Register an event handler for when an XML file is opened.
	const disposable: vscode.Disposable = vscode.workspace.onDidOpenTextDocument((document: vscode.TextDocument) => {
		if (document.languageId === "xml") {
			const openCDATAPrompt: Thenable<"Yes" | "No" | undefined> = vscode.window.showInformationMessage(
				"Open associated CDATA tags?",
				"Yes",
				"No"
			);

			openCDATAPrompt.then((choice: "Yes" | "No" | undefined) => {
				if (choice === "Yes") {
					// Get the text content of the XML file.
					const xmlContent: string = document.getText();
					xmlFile = document;

					// Extract the content inside CDATA tags.
					const cdataContent: string[] = xmlUtilities.extractCDataContent(xmlContent);

					// Create and open each CDATA content in a new file.
					cdataContent.forEach((content: string, index: number) => {
						xmlUtilities.createAndOpenCDATAFile(
							content,
							settings.programmingLanguage,
							settings.programmingLanguageExtension,
							index,
							cdataFiles
						);
					});

					if (settings.cdataPosition.toLowerCase() === "left") {
						setTimeout(() => {
							xmlUtilities.moveXmlFileToLastGroup(cdataContent.length, settings.openDelay);
						}, settings.openDelay);
					}
				}
			});
		}
	});

	context.subscriptions.push(disposable);

	let syncTimeout: NodeJS.Timeout | undefined;

	// Register the event handler for text changes in CDATA files
	vscode.workspace.onDidChangeTextDocument(async (event: vscode.TextDocumentChangeEvent) => {
		// Check if the modified file is a CDATA file
		const fileNameRegex = /cdata_file_\d+\.[^.]+$/;
		if (!fileNameRegex.test(event.document.fileName)) {
			return; // Skip processing for non-CDATA files
		}

		const xmlFileUri = Object.keys(cdataFiles).find(
			(uri) => cdataFiles[uri].uri.toString() === event.document.uri.toString()
		);

		// Clear any previous timeouts to avoid multiple syncs
		if (syncTimeout) {
			clearTimeout(syncTimeout);
		}

		// Create a new timeout to delay the sync
		syncTimeout = setTimeout(async () => {
			if (xmlFileUri && xmlFile) {
				// Get the index from the file name (cdata_file_[index]) using regex, falling back to 0 if no match found
				const match = path.basename(event.document.fileName).match(/cdata_file_(\d+)\.[^.]+$/);

				let fileIndex: string;
				if (match) {
					fileIndex = match[1];
				} else {
					fileIndex = "0";
				}

				const index = parseInt(fileIndex, 10);
				const modifiedCdataContent: string = event.document.getText();
				const updatedXmlContent: string = xmlUtilities.getUpdatedXMLContent(
					xmlFile.getText(),
					modifiedCdataContent,
					index
				);

				// Apply the changes to the XML file.
				const edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
				edit.replace(xmlFile.uri, new vscode.Range(0, 0, xmlFile.lineCount, 0), updatedXmlContent);
				await vscode.workspace.applyEdit(edit);
			}
		}, settings.updateDelay);
	});
}

// This method is called when the extension is deactivated.
export function deactivate() {
	// Clean up any resources used by the extension.
	// This method is called when the user deactivates the extension or
	// when Visual Studio Code is shutting down.
}
