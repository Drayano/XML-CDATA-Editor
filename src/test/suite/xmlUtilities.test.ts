import * as assert from "assert";
import * as Mocha from "mocha";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as xmlUtilities from "../../xmlUtilities";

suite("XML Utilities Test Suite", () => {
	vscode.window.showInformationMessage("Start all tests.");

	Mocha.describe("extractCDataContent", function () {
		Mocha.it("Should extract CDATA tag contents from XML content", function () {
			const xmlContent = `
			<root>
			  <item><![CDATA[CDATA Content 1]]></item>
			  <item><![CDATA[CDATA Content 2]]></item>
			  <item><![CDATA[CDATA Content 3]]></item>
			</root>
		  `;
			const expectedContents = ["CDATA Content 1", "CDATA Content 2", "CDATA Content 3"];

			const extractedContents = xmlUtilities.extractCDataContent(xmlContent);

			assert.deepStrictEqual(extractedContents, expectedContents);
		});

		Mocha.it("Should return an empty array if no CDATA tags are found", function () {
			const xmlContent = `
			<root>
			  <item>Regular Content</item>
			</root>
		  `;

			const extractedContents = xmlUtilities.extractCDataContent(xmlContent);

			assert.deepStrictEqual(extractedContents, []);
		});

		Mocha.it("EDGE CASE - CDATA Tags inside the content", function () {
			const xmlContent = `
			<root>
			  <item><![CDATA[CDATA Content 1]]></item>
			  <item><![CDATA[CDATA OUTSIDE CONTENT \\<![CDATA[CDATA INSIDE CONTENT]]\\> CDATA OUTSIDE CONTENT]]></item>
			  <item><![CDATA[CDATA Content 3]]></item>
			</root>
		  `;
			const expectedContents = [
				"CDATA Content 1",
				"CDATA OUTSIDE CONTENT \\<![CDATA[CDATA INSIDE CONTENT]]\\> CDATA OUTSIDE CONTENT",
				"CDATA Content 3",
			];

			const extractedContents = xmlUtilities.extractCDataContent(xmlContent);

			assert.deepStrictEqual(extractedContents, expectedContents);
		});
	});

	Mocha.describe("getUpdatedXMLContent", function () {
		Mocha.it("Should update the CDATA tag at the given index", function () {
			const xmlContent = `
            <root>
              <item><![CDATA[Old CDATA Content 1]]></item>
              <item><![CDATA[Old CDATA Content 2]]></item>
              <item><![CDATA[Old CDATA Content 3]]></item>
            </root>
          `;
			const cdataContent = "New CDATA Content";
			const index = 1;
			const expectedOutput = `
            <root>
              <item><![CDATA[Old CDATA Content 1]]></item>
              <item><![CDATA[New CDATA Content]]></item>
              <item><![CDATA[Old CDATA Content 3]]></item>
            </root>
          `;

			const updatedXmlContent = xmlUtilities.getUpdatedXMLContent(
				xmlContent,
				cdataContent,
				index,
			);

			assert.strictEqual(updatedXmlContent.trim(), expectedOutput.trim());
		});

		Mocha.it(
			"Should return the original XML content if the index is out of range",
			function () {
				const xmlContent = `
            <root>
              <item><![CDATA[Old CDATA Content 1]]></item>
            </root>
          `;
				const cdataContent = "New CDATA Content";
				const index = 1;

				const updatedXmlContent = xmlUtilities.getUpdatedXMLContent(
					xmlContent,
					cdataContent,
					index,
				);

				assert.strictEqual(updatedXmlContent.trim(), xmlContent.trim());
			},
		);
	});
});
