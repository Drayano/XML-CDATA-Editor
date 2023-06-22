import * as vscode from "vscode";

export function getSettings() {
	const programmingLanguage =
		vscode.workspace.getConfiguration()?.get<string>("xmlCdataConfig.programmingLanguage") ??
		"javascript";
	const programmingLanguageExtension =
		vscode.workspace
			.getConfiguration()
			?.get<string>("xmlCdataConfig.programmingLanguageExtension") ?? "js";
	const cdataPosition =
		vscode.workspace.getConfiguration()?.get<string>("xmlCdataConfig.cdataPosition") ?? "left";
	const updateDelay = parseInt(
		vscode.workspace.getConfiguration()?.get<string>("xmlCdataConfig.updateDelay") ?? "1500",
	);
	const openDelay = parseInt(
		vscode.workspace.getConfiguration()?.get<string>("xmlCdataConfig.updateDelay") ?? "500",
	);

	return {
		programmingLanguage,
		programmingLanguageExtension,
		cdataPosition,
		updateDelay,
		openDelay,
	};
}
