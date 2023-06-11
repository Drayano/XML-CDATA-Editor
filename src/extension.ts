import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

let xmlFile: vscode.TextDocument | undefined;

export function activate(context: vscode.ExtensionContext): void {
	let programmingLanguage =
		vscode.workspace.getConfiguration()?.get<string>("xmlCdataConfig.programmingLanguage") ?? "javascript";
	let programmingLanguageExtension =
		vscode.workspace.getConfiguration()?.get<string>("xmlCdataConfig.programmingLanguageExtension") ?? "js";
	let cdataPosition = vscode.workspace.getConfiguration()?.get<string>("xmlCdataConfig.cdataPosition") ?? "left";
	let updateDelay = parseInt(
		vscode.workspace.getConfiguration()?.get<string>("xmlCdataConfig.updateDelay") ?? "1500"
	);
	let openDelay = parseInt(vscode.workspace.getConfiguration()?.get<string>("xmlCdataConfig.updateDelay") ?? "200");

	vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
		// Check if each setting has been changed and update it if needed
		if (event.affectsConfiguration("xmlCdataConfig.programmingLanguage")) {
			programmingLanguage =
				vscode.workspace.getConfiguration()?.get<string>("xmlCdataConfig.programmingLanguage") ?? "javascript";
		}

		if (event.affectsConfiguration("xmlCdataConfig.programmingLanguageExtension")) {
			programmingLanguageExtension =
				vscode.workspace.getConfiguration()?.get<string>("xmlCdataConfig.programmingLanguageExtension") ?? "js";
		}

		if (event.affectsConfiguration("xmlCdataConfig.cdataPosition")) {
			cdataPosition = vscode.workspace.getConfiguration()?.get<string>("xmlCdataConfig.cdataPosition") ?? "left";
		}

		if (event.affectsConfiguration("xmlCdataConfig.updateDelay")) {
			updateDelay = parseInt(
				vscode.workspace.getConfiguration()?.get<string>("xmlCdataConfig.updateDelay") ?? "1500"
			);
		}

		if (event.affectsConfiguration("xmlCdataConfig.openDelay")) {
			openDelay = parseInt(vscode.workspace.getConfiguration()?.get<string>("xmlCdataConfig.openDelay") ?? "200");
		}
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
					const cdataContent: string[] = extractCDataContent(xmlContent);

					// Create and open each CDATA content in a new file.
					cdataContent.forEach((content: string, index: number) => {
						createAndOpenCDATAFile(
							content,
							programmingLanguage,
							programmingLanguageExtension,
							index,
							updateDelay
						);
					});

					if (cdataPosition.toLowerCase() === "left") {
						setTimeout(() => {
							moveXmlFileToLastGroup(cdataContent.length, openDelay);
						}, openDelay);
					}
				}
			});
		}
	});

	context.subscriptions.push(disposable);
}

/**
 * Create and open XML CDATA tag content into their own files
 *
 *
 * @param code - The content that will be copied inside the file
 * @param programmingLanguage - The programming language that the file will be treated as
 * @param programmingLanguageExtension - The extension of the file
 * @param index - The index of the CDATA tag inside the XML file (0 for the first CDATA tag, 1 for the second etc...)
 * @param updateDelay - The delay (in milliseconds) between each sync operation
 *
 */
function createAndOpenCDATAFile(
	code: string,
	programmingLanguage: string,
	programmingLanguageExtension: string,
	index: number,
	updateDelay: number
): void {
	const fileName: string = `cdata_file_${index}.${programmingLanguageExtension}`;
	const currentWorkspaceFolder: string | undefined = vscode.workspace.workspaceFolders?.at(0)?.uri.fsPath;
	const filePath = path.join(currentWorkspaceFolder || "", fileName);

	fs.writeFile(filePath, code, (error) => {
		if (error) {
			vscode.window.showErrorMessage(`Failed to create file: ${fileName}`);
			return;
		}

		vscode.workspace.openTextDocument(filePath).then((document: vscode.TextDocument) => {
			// +2 because the index starts at 0 and the first element will always
			// have to spawn in column 2 because the XML file is in column 1
			const columnIndex: vscode.ViewColumn = index + 2;

			vscode.window.showTextDocument(document, {
				preserveFocus: true,
				viewColumn: columnIndex,
			});

			vscode.languages.setTextDocumentLanguage(document, programmingLanguage);

			let syncTimeout: NodeJS.Timeout | undefined;

			// Register an event handler for text changes in the CDATA editor.
			vscode.workspace.onDidChangeTextDocument(async (event: vscode.TextDocumentChangeEvent) => {
				// Check if the modified file is a CDATA file
				const fileNameRegex = /cdata_file_\d+\.[^.]+$/;
				if (!fileNameRegex.test(event.document.fileName)) {
					return; // Skip processing for non-CDATA files
				}

				if (event.document.uri.toString() === document.uri.toString()) {
					const modifiedCdataContent: string = event.document.getText();

					// Clear any previous timeouts to avoid multiple syncs
					if (syncTimeout) {
						clearTimeout(syncTimeout);
					}

					// Create a new timeout to delay the sync
					syncTimeout = setTimeout(async () => {
						if (xmlFile) {
							const updatedXmlContent: string = getUpdatedXMLContent(
								xmlFile.getText(),
								modifiedCdataContent,
								index
							);

							// Apply the changes to the XML file.
							const edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
							edit.replace(xmlFile.uri, new vscode.Range(0, 0, xmlFile.lineCount, 0), updatedXmlContent);
							await vscode.workspace.applyEdit(edit);
						}
					}, updateDelay);
				}
			});
		});
	});
}

/**
 * Extract XML CDATA tag contents given an XML file content as a string
 *
 *
 * @param xmlContent - The XML file content as a string
 * @returns An array containing each CDATA tag contents
 *
 */
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

/**
 * Extract XML CDATA tag contents given an XML file content as a string
 *
 *
 * @param xmlContent - The XML file content as a string
 * @param cdataContent - The CDATA content that has changed
 * @param index - The index of the CDATA tag inside the XML file (0 for the first CDATA tag, 1 for the second etc...)
 * @returns A string containing the XML file with the updated CDATA tag
 *
 */
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

/**
 * Extract XML CDATA tag contents given an XML file content as a string
 *
 *
 * @param index - The index of the CDATA tag (the function will then calculate where to open the CDATA tag in a side-by-side view)
 * @param openDelay - The delay (in milliseconds) before moving the XML file to the last group
 *
 */
function moveXmlFileToLastGroup(index: number, openDelay: number): void {
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
		// +2 because the index starts at 0 and the first element will always
		// have to spawn in column 2 because the XML file is in column 1
		const columnIndex: vscode.ViewColumn = index + 2;

		vscode.window.showTextDocument(xmlEditor.document, {
			preserveFocus: true,
			viewColumn: columnIndex,
		});

		// Close the old XML view after opening the new one, the delay will have to be the same (or higher)
		// as the delay to open the CDATA files so as to not cause any issues
		setTimeout(() => {
			vscode.commands.executeCommand("workbench.action.closeActiveEditor");
		}, openDelay);
	}
}

// This method is called when the extension is deactivated.
export function deactivate() {
	// Clean up any resources used by the extension.
	// This method is called when the user deactivates the extension or
	// when Visual Studio Code is shutting down.
}
