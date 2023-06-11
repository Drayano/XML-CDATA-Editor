import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

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
export function createAndOpenCDATAFile(
	code: string,
	programmingLanguage: string,
	programmingLanguageExtension: string,
	index: number,
	cdataFiles: { [key: string]: vscode.TextDocument }
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

			cdataFiles[document.uri.toString()] = document; // Store the CDATA file in the map
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
export function extractCDataContent(xmlContent: string): string[] {
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
export function getUpdatedXMLContent(xmlContent: string, cdataContent: string, index: number): string {
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
export function moveXmlFileToLastGroup(index: number, openDelay: number): void {
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
