import * as vscode from "vscode";

let xmlFile: vscode.TextDocument | undefined;

// TODO : Make that a setting
let programmingLanguage: string = "javascript";

export function activate(context: vscode.ExtensionContext): void {
	let xmlEditor: vscode.TextEditor | undefined;

	// Register an event handler for when an XML file is opened.
	let disposable: vscode.Disposable = vscode.workspace.onDidOpenTextDocument((document: vscode.TextDocument) => {
		// Check if the opened file has an XML language ID.
		if (document.languageId === "xml") {
			// Prompt the user to open associated CDATA tags.
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
					xmlEditor = vscode.window.activeTextEditor;

					// Extract the content inside CDATA tags.
					const cdataContent: string[] = extractCDataContent(xmlContent);

					// Open each CDATA content in a new file.
					cdataContent.forEach((content: string, index: number) => {
						openInNewWindow(content, programmingLanguage, index);
					});
				}
			});
		}
	});

	context.subscriptions.push(disposable);
}

// Function to open the matched CDATA content in a new file
function openInNewWindow(code: string, programmingLanguage: string, index: number): void {
	let cdataFiles: vscode.TextDocument[] = [];
	const languageId: string = programmingLanguage;

	vscode.workspace
		.openTextDocument({
			language: languageId,
			content: code,
		})
		.then((document: vscode.TextDocument) => {
			vscode.window.showTextDocument(document, {
				preserveFocus: false,
				viewColumn: vscode.ViewColumn.Beside,
			});

			// Change the document language to the specified programming language
			vscode.languages.setTextDocumentLanguage(document, languageId);

			// Save the document to the cdataFiles array
			cdataFiles[index] = document;

			// TODO : Add a condition here to have this feature as a setting
			// Move the XML file to the last group with a small delay
			setTimeout(() => {
				moveXmlFileToLastGroup();
			}, 100);

			// Declare a variable to hold the timeout ID
			let syncTimeout: NodeJS.Timeout | undefined;

			// Register an event handler for text changes in the CDATA editor.
			const disposable: vscode.Disposable = vscode.workspace.onDidChangeTextDocument(
				async (event: vscode.TextDocumentChangeEvent) => {
					// Find the index of the current CDATA document in the cdataFiles array
					const currentIndex: number = cdataFiles.findIndex((file) => file === event.document);
					if (currentIndex !== -1) {
						// Retrieve the modified CDATA content.
						const modifiedCdataContent: string = event.document.getText();

						// Clear any previous timeouts to avoid multiple syncs
						if (syncTimeout) {
							clearTimeout(syncTimeout);
						}

						// Create a new timeout to delay the sync
						syncTimeout = setTimeout(async () => {
							// Update the XML document with the modified CDATA content.
							if (xmlFile) {
								const updatedXmlContent: string = getUpdatedXMLContent(
									xmlFile.getText(),
									modifiedCdataContent,
									currentIndex
								);

								// Apply the changes to the XML file.
								const edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
								edit.replace(
									xmlFile.uri,
									new vscode.Range(0, 0, xmlFile.lineCount, 0),
									updatedXmlContent
								);
								await vscode.workspace.applyEdit(edit);
							}
						}, 1500); // Delay in milliseconds
					}
				}
			);
		});
}

// Function to extract content inside CDATA tags using regex.
function extractCDataContent(xmlContent: string): string[] {
	const regex: RegExp = /<!\[CDATA\[(.*?)]]>/gs;
	const matches: RegExpMatchArray | null = xmlContent.match(regex);

	if (matches && matches.length > 0) {
		// Remove the CDATA tags from each match.
		const cdataContent: string[] = matches.map((match) => match.replace(/<!\[CDATA\[|\]\]>/g, ""));
		return cdataContent;
	}

	return [];
}

// Function to get the new XML document content with modified CDATA content.
function getUpdatedXMLContent(xmlContent: string, cdataContent: string, index: number): string {
	const regex = /<!\[CDATA\[(.*?)]]>/gs;
	let match: RegExpExecArray | null;
	let count: number = 0;
	let updatedXmlContent: string = xmlContent;

	// Replace the corresponding CDATA tag at the given index
	while ((match = regex.exec(xmlContent)) !== null) {
		if (count === index) {
			const start: number = match.index;
			const end: number = start + match[0].length;
			updatedXmlContent =
				updatedXmlContent.substring(0, start) +
				`<![CDATA[${cdataContent}]]>` +
				updatedXmlContent.substring(end);
			break;
		}
		count++;
	}

	return updatedXmlContent;
}

// Function to move the XML file to the last group
function moveXmlFileToLastGroup(): void {
	const xmlEditor: vscode.TextEditor | undefined = vscode.window.visibleTextEditors.find(
		(editor: vscode.TextEditor) => editor.document.languageId === "xml"
	);

	if (!xmlEditor) {
		return;
	}

	const groupCount: number = vscode.window.visibleTextEditors.reduce(
		(maxGroup: number, editor: vscode.TextEditor) => Math.max(maxGroup, editor.viewColumn || 0),
		0
	);

	const xmlColumn: vscode.ViewColumn | undefined = xmlEditor.viewColumn;

	if (xmlColumn && xmlColumn !== groupCount) {
		vscode.window.showTextDocument(xmlEditor.document, {
			preserveFocus: true,
			viewColumn: vscode.ViewColumn.Beside,
		});

		// Hide the old XML view after opening the new one
		setTimeout(() => {
			xmlEditor.hide();
		}, 100);
	}
}

// This method is called when the extension is deactivated.
export function deactivate() {
	// Clean up any resources used by the extension.
	// This method is called when the user deactivates the extension or
	// when Visual Studio Code is shutting down.
}
