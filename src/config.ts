import { workspace } from 'vscode';

export class Config {
  static getLanguageCodes() {
    return workspace.getConfiguration().get('com.leaphawk.transliterator.languages', ['hi', 'he']);
  }

  static getSuggestionsCount() {
    return workspace.getConfiguration().get('com.leaphawk.transliterator.suggestions', 2);
  }

  static getErrrorMessage() {
    return 'Unable to transliterate your text';
  }

}