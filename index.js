/*
Copyright 2023 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const valueParser = require("postcss-value-parser");

/** @type import('postcss').PluginCreator */
module.exports = ({ dropRefs = false }) => {
  return {
    postcssPlugin: "postcss-dropunusedvars",
    prepare() {
      /**
       * @type Map<string, { definitions: import('postcss').Declaration[], declUsing: import('postcss').Declaration[], propsUsing: string[]}>
       */
      const propMetadata = new Map();

      return {
        Declaration(decl, {}) {
          // Check if this declaration is a custom property
          const isProp = decl.prop.startsWith("--");
          // Check if this declaration uses a custom property
          const usesProp = decl.value.match(/var\(.*?\)/g);

          // If this neither is a custom property nor uses a custom property, stop processing
          if (!isProp && !usesProp) return;

          // If this is a custom property and it is not referencing any other custom properties, add it to the set and stop processing
          if (isProp) {
            const propDef = propMetadata.has(decl.prop)
              ? propMetadata.get(decl.prop)
              : {
                  decl: [decl],
                  declUsing: [],
                  propsUsing: [],
                };

            propMetadata.set(decl.prop, propDef);

            if (!usesProp) return;
          }

          function parseValueForProperties(node) {
            if (node.type === "function" && node.value !== "var") return;
            if (!node.nodes) return;

            for (const item of node.nodes) {
              // If this is neither a function nor a word, skip it
              if (["function", "word"].every((type) => item.type !== type))
                continue;

              // Recurse if the value is a var function?
              if (item.type === "function") {
                parseValueForProperties(item);
                continue;
              }

              const usedPropName = item.value;
              if (!usedPropName.startsWith("--")) continue;

              // Check if this custom property has been defined yet
              // -- if yes, get existing data about this custom property from the map
              // -- if no, create an empty dataset
              const propDef = propMetadata.has(usedPropName)
                ? propMetadata.get(usedPropName)
                : {
                    decl: [],
                    declUsing: [],
                    propsUsing: [],
                  };

              if (isProp) {
                // If this is a property definition, add it to the list of declarations using this property
                propDef.propsUsing.push(decl.prop);
              } else {
                // If this is a property usage, add it to the list of declarations using this property
                propDef.declUsing.push(decl);
              }
              propMetadata.set(usedPropName, propDef);
            }
          }

          // Parse value and get a list of variables used
          valueParser(decl.value).walk(parseValueForProperties);
        },
        // Drop unused variable definitions
        /** @type import('postcss').Processors['OnceExit'] */
        OnceExit(root, { result }) {
          function shouldRemoveProperty([propName, propDef]) {
            const { decl, declUsing, propsUsing } = propDef;

            if (!decl) {
              if (!declUsing?.length && !propsUsing?.length) {
                root.warn(result, `How on earth did you get here?`, {
                  word: propName,
                });
              }
              // @todo add a verbose flag and only print this if true
              else if (declUsing?.length || propsUsing?.length) {
                // This might be expected b/c it could be an intentionally empty variable
                // @todo feature to add an allowlist of empty variable prefixes or names?
                root.warn(
                  result,
                  `The property ${propName} was used but not defined.`,
                  {
                    word: propName,
                  }
                );
              }
              // I don't think this should ever happen, a property not defined and not used
              // should not be able to get into the map
              return false;
            }

            // If this property is being used, keep going without processing
            if (declUsing?.length) return false;

            if (!propsUsing?.length) {
              root.warn(
                result,
                `The property ${propName} was defined but not used.`,
                {}
              );
              // Remove the declarations that were not being used
              // decl.forEach(d => d.remove());
              return true;
            }

            if (!dropRefs) return false;

            return propsUsing.reduce((acc, prop) => {
              const propDef = propMetadata.get(prop);
              if (shouldRemoveProperty([prop, propDef])) {
                return true;
              }
              return acc;
            }, false);
          }

          Array.from(propMetadata.entries()).forEach((entry) => {
            if (shouldRemoveProperty(entry)) {
              const [, { decl }] = entry;
              decl.forEach((d) => d.remove());
            }
          });
        },
      };
    },
  };
};
