import isStandardSyntaxRule from 'stylelint/lib/utils/isStandardSyntaxRule.mjs';
import stylelint from 'stylelint';
const {
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

export const ruleName = 'a11y/no-spread-text';

export const messages = ruleMessages(ruleName, {
  expected: (selector) => `Unexpected max-width in ${selector}`,
});

const textStyles = [
  'text-decoration',
  'text-align',
  'text-transform',
  'text-indent',
  'letter-spacing',
  'line-height',
  'direction',
  'word-spacing',
  'text-shadow',
  'text-overflow',
  'color',
];

const nodesProbablyForText = (nodes) =>
  nodes
    .map((node) => node.prop)
    .filter(Boolean)
    .map((prop) => prop.toLowerCase())
    .some((prop) => textStyles.includes(prop));

export default function noSpreadText(actual) {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, { actual });

    if (!validOptions || !actual) {
      return;
    }

    root.walkRules((rule) => {
      let selector = null;

      if (!isStandardSyntaxRule(rule)) {
        return;
      }

      selector = rule.selector;

      if (!selector) {
        return;
      }

      const isRejected =
        nodesProbablyForText(rule.nodes) &&
        rule.nodes.some((o) => {
          return (
            o.type === 'decl' &&
            o.prop.toLowerCase() === 'max-width' &&
            o.value.toLowerCase().endsWith('ch') &&
            (parseFloat(o.value) < 45 || parseFloat(o.value) > 80)
          );
        });

      if (isRejected) {
        report({
          index: rule.lastEach,
          message: messages.expected(selector),
          node: rule,
          ruleName,
          result,
        });
      }
    });
  };
}
