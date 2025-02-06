import isCustomSelector from 'stylelint/lib/utils/isCustomSelector.mjs';
import isStandardSyntaxAtRule from 'stylelint/lib/utils/isStandardSyntaxAtRule.mjs';
import isStandardSyntaxRule from 'stylelint/lib/utils/isStandardSyntaxRule.mjs';
import isStandardSyntaxSelector from 'stylelint/lib/utils/isStandardSyntaxSelector.mjs';

import stylelint from 'stylelint';
const {
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

export const ruleName = 'a11y/media-prefers-color-scheme';

export const messages = ruleMessages(ruleName, {
  expected: (selector) => `Expected ${selector} is used with @media (prefers-color-scheme)`,
});
const targetProperties = ['background-color', 'color'];

function check(selector, node) {
  const declarations = node.nodes;
  const params = node.parent.params;
  const parentNodes = node.parent.nodes;

  if (!declarations) return true;

  if (!isStandardSyntaxSelector(selector)) {
    return true;
  }

  if (isCustomSelector(selector)) {
    return true;
  }

  let currentSelector = null;

  const declarationsIsMatched = declarations.some((declaration) => {
    const noMatchedParams = !params || params.indexOf('prefers-color-scheme') === -1;
    const index = targetProperties.indexOf(declaration.prop);

    currentSelector = targetProperties[index];

    return index >= 0 && noMatchedParams;
  });

  if (!declarationsIsMatched) return true;

  if (declarationsIsMatched) {
    const parentMatchedNode = parentNodes.some((parentNode) => {
      if (!parentNode || !parentNode.nodes) return false;

      return parentNode.nodes.some((childrenNode) => {
        const childrenNodes = childrenNode.nodes;

        if (
          !parentNode.params ||
          !Array.isArray(childrenNodes) ||
          selector !== childrenNode.selector
        )
          return false;

        const matchedChildrenNodes = childrenNodes.some((declaration) => {
          const index = targetProperties.indexOf(declaration.prop);

          if (currentSelector !== targetProperties[index]) return false;

          return index >= 0 && parentNode.params.indexOf('prefers-color-scheme') >= 0;
        });

        return matchedChildrenNodes;
      });
    });

    if (!parentMatchedNode) return false;

    return true;
  }

  return true;
}

export default function mediaPrefersColorScheme(actual) {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, { actual });

    if (!validOptions || !actual) {
      return;
    }

    root.walk((node) => {
      let selector = null;

      if (node.type === 'rule') {
        if (!isStandardSyntaxRule(node)) {
          return;
        }

        selector = node.selector;
      } else if (node.type === 'atrule' && node.name === 'page' && node.params) {
        if (!isStandardSyntaxAtRule(node)) {
          return;
        }

        selector = node.params;
      }

      if (!selector) {
        return;
      }

      const isAccepted = check(selector, node);

      if (!isAccepted) {
        report({
          index: node.lastEach,
          endIndex: node.lastEach,
          message: messages.expected(selector),
          node,
          ruleName,
          result,
        });
      }
    });
  };
}
