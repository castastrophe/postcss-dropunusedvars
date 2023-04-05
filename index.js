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

const valueParser = require('postcss-value-parser');

/** @type import('postcss').PluginCreator */
module.exports = () => {
  return {
    postcssPlugin: 'postcss-dropunusedvars',
    prepare() {
      const usedAnywhere = [];
      const usedInProps = [];
      const variableRelationships = {};
      return {
        // Find all used variables
        Declaration(decl, {}) {
          const usedInDecl = [];

          const isVar = decl.prop.startsWith('--');
          const matches = decl.value.match(/var\(.*?\)/g);
          if (matches) {
            // Parse value and get a list of variables used
            const parsed = valueParser(decl.value);
            parsed.walk(node => {
              if (node.type === 'function' && node.value === 'var') {
                if (node.nodes.length) {
                  const varName = node.nodes[0].value;
                  usedInDecl.push(varName);
                  usedAnywhere.push(varName);
                  if (!isVar) {
                    usedInProps.push(varName);
                  }
                }
              }
            });
          }

          // Store every variable referenced by this var
          if (isVar && usedInDecl.length) {
            for (let varName of usedInDecl) {
              variableRelationships[varName] = variableRelationships[varName] || [];
              variableRelationships[varName].push(decl.prop);
            }
          }
        },
        // Drop unused variable definitions
        Declaration(decl, {}) {
          if (!decl.prop.startsWith('--')) return;

          // Definitely drop it if it's never used
          if (!usedAnywhere.includes(decl.prop)) {
            decl.remove();
            return;
          }

          if (usedInProps.includes(decl.prop)) return;

          // Drop a variable if everything that references it has been removed
          const relatedVars = variableRelationships[decl.prop];
          if (!relatedVars || !relatedVars.length) return;

          let keep = false;
          // Check if everything that references this variable has been removed
          for (let relatedVar of relatedVars) {
            if (!usedAnywhere.includes(relatedVar)) continue;

            keep = true;
            break;
          }

          if (!keep) decl.remove();
        },
      };
    },
  };
};
