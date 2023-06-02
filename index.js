/*!
Copyright 2023. All rights reserved.
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
module.exports = ({ fix = true }) => {
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
            // Does this property already exist in the map?
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

          const parseValueForProperties = (node) => {
            // We're only interested here in var functions
            if (node.type !== "function" || node.type === "function" && node.value !== "var") {
              return;
            }

            // Why would a var not have nodes? 🤷‍♀️
            if (!node.nodes || node.nodes.length === 0) return;

            for (const item of node.nodes) {
              // Recurse if the value is a var function
              if (item.type === "function") {
                parseValueForProperties(item);
                continue;
              }

              // If the value is not a word, we're not interested anymore
              // i.e., commas, etc.
              if (item.type !== "word") {
                continue;
              }

              // Check if this custom property has been defined yet
              // -- if yes, get existing data about this custom property from the map
              // -- if no, create an empty dataset
              const propDef = propMetadata.has(item.value)
                ? propMetadata.get(item.value)
                : {
                    decl: [decl],
                    declUsing: [],
                    propsUsing: [],
                  };

              if (decl.prop.startsWith("--")) {
                // If this is a property definition, add it to the list of declarations using this property
                propDef.propsUsing.push(decl.prop);
              } else {
                // If this is a property usage, add it to the list of declarations using this property
                propDef.declUsing.push(decl);
              }
              propMetadata.set(item.value, propDef);
            }
          };

          // Parse value and get a list of variables used
          valueParser(decl.value).walk(parseValueForProperties);
        },

        // Drop unused variable definitions
        /** @type import('postcss').Processors['OnceExit'] */
        OnceExit(root, { result }) {
          // If the map is empty, we're all set!
          if (propMetadata.size === 0) return;

          const isUnused = ([, { decl = [], declUsing = [], propsUsing = [] }]) => {
            // Really shouldn't happen, but if it does, keep going without processing
            if (!decl.length) return true;

            // If this property is being used, keep going without processing
            if (declUsing.length > 0) return false;

            // If we're dropping references, we need to check if the properties using this property are unused
            // Reduce the list of properties using the propName to a boolean
            return propsUsing.reduce((acc, prop) => {
              // Find out if the property using this property is used...
              return isUnused([prop, propMetadata.get(prop)]) && acc;
            }, true);
          };

          [...propMetadata.entries()].forEach((entry) => {
            if (!isUnused(entry)) return;

            // entry values include: all declarations with the same property name, all declarations using this property, and the name of all properties that are referencing this property name
            const [propName, { decl: declarations }] = entry;

            declarations.forEach((d) => {
              if (fix) d.remove();
              else root.warn(
                result,
                `The property ${propName} was defined but not used.`,
                {
                  word: propName,
                  decl: d,
                  result: result,
                }
              );
            });
          });
        },
      };
    },
  };
};
