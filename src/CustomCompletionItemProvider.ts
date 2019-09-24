import { Position, TextDocument, CompletionItem, window, CompletionItemProvider, ProviderResult, CompletionList } from "vscode";
import fetch from 'node-fetch';

import { Config } from "./config";

const getSearchText = (lineText: string, position: Position) => {
  const matches = lineText.substr(0, position.character).trim().match(/\w*$/);
  if (matches) {
    return matches[0];
  }
  return '';
};

/**
 *  Input auto-completion provider
 */
export class InputAutoCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(document: TextDocument, position: Position): ProviderResult<CompletionItem[] | CompletionList> { // eslint-disable-line
    const lineAt = document.lineAt(position);
    const lineText = document.getText(lineAt.range);

    const searchText = getSearchText(lineText, position);
    const languages = Config.getLanguageCodes();
    const suggestionsCount = Config.getSuggestionsCount();

    if (searchText !== '') {

      const languagePromises: Promise<any>[] = [];
      languages.forEach(lang => {
        languagePromises.push(fetch(`https://inputtools.google.com/request?text=${searchText}&itc=${lang}-t-i0-und&num=${suggestionsCount}`));
      });

      return new Promise((resolve, reject) => {
        Promise.all(languagePromises).then(async (responses) => {

          let items: any[] = [];
          const jsonPromises = responses.map(response => {
            return response.json();
          });

          Promise.all(jsonPromises).then(jsonItems => {
            jsonItems.map(json => {
              items.push(...this.extractSuggestionItems(json, searchText));
            });

            resolve(items);
            // console.log(items);
          });
        }).catch((errs: Error[]) => {
          window.showWarningMessage(Config.getErrrorMessage());
          // console.error(errs);
          reject(errs[0]);
        });

      });
    }
    return [];
  }

  extractSuggestionItems(response: any, searchText: string): CompletionItem[] {
    if (typeof response[0] === 'string' && response[0] !== 'SUCCESS') {
      window.showWarningMessage(Config.getErrrorMessage());
      throw new Error(response[0]);
    }
    const results = response[1][0][1];
    const items = [];
    let i = 0;
    for (const result of results) { // eslint-disable-line no-restricted-syntax
      const item = new CompletionItem(result);
      item.filterText = searchText;
      item.sortText = String(i++); // eslint-disable-line no-plusplus
      items.push(item);
    }

    // Add the actual typed text to suggestions list
    const item = new CompletionItem(searchText);
    item.sortText = String(i);
    items.push(item);
    return items;
  }
}

