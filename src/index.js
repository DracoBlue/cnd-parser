var CndParser = function(cndString) {
    var that = this;
    this.rawCndString = cndString;
    this.nodeTypes = this.parseString(this.rawCndString);
    this.namespaces = [];
    this.mixins = [];

    var namespaceNamesMap = {};
    this.nodeTypes.forEach(function(nodeType) {
        if (nodeType.namespace) {
            namespaceNamesMap[nodeType.namespace] = nodeType.namespace;
        }
        if (nodeType.options.mixin) {
            that.mixins.push(nodeType);
        }
    });

    for (var key in namespaceNamesMap) {
        if (namespaceNamesMap.hasOwnProperty(key)) {
            this.namespaces.push(namespaceNamesMap[key]);
        }
    }
};

CndParser.prototype.getMixins = function() {
    return this.mixins;
};

CndParser.prototype.getNodeTypes = function() {
    return this.nodeTypes;
};

CndParser.prototype.getNamespaces = function() {
    return this.namespaces;
};

CndParser.prototype.replaceAllNewLinesToUnixNewLines = function(rawCndString) {
    return (rawCndString || '').replace(/\r\n/g, '\n');
};

CndParser.prototype.stripCommentsFromCndString = function(rawCndString) {
    return (rawCndString || '').replace(/\/\/.*$/g, '');
};

CndParser.prototype.removeIndentionForAllLines = function(rawCndString) {
    return (rawCndString || '').replace(/^([\s]+)/mg, '');
};

CndParser.prototype.removeEmptyLines = function(rawCndString) {
    return (rawCndString || '').replace(/^[\s]*$/mg, '');
};

CndParser.prototype.removeIndentionAfterPlusAndMinusAtTheBeginning = function(rawCndString) {
    return (rawCndString || '').replace(/^([\+-])(\s+)/mg, '$1');
};

CndParser.prototype.parseString = function(rawCndString) {
    var that = this;

    rawCndString = this.replaceAllNewLinesToUnixNewLines(rawCndString);
    rawCndString = this.stripCommentsFromCndString(rawCndString);
    rawCndString = this.removeIndentionForAllLines(rawCndString);
    rawCndString = this.removeEmptyLines(rawCndString);
    rawCndString = this.removeIndentionAfterPlusAndMinusAtTheBeginning(rawCndString);

    var isInNodeTypeDefinition = false;
    var currentNodeTypeDefinition = null;
    var nodeTypeDefinitions = [];

    rawCndString.split('\n').forEach(function(rawLine) {
        rawLine = rawLine.trim();
        var firstCharacterOfRow = rawLine.substr(0, 1);
        if (firstCharacterOfRow == '<') {
            /* parse Namespace */
        } else if (firstCharacterOfRow == '[') {
            /* parse NodeType start */
            if (isInNodeTypeDefinition) {
                nodeTypeDefinitions.push(currentNodeTypeDefinition);
            }
            isInNodeTypeDefinition = true;
            currentNodeTypeDefinition = that.parseNodeTypeDefinitionStartLine(rawLine);
        } else if (firstCharacterOfRow == '-') {
            if (!isInNodeTypeDefinition) {
                console.error('Cannot parse property definition, if we are not in nodeTypeDefinition: ' + rawLine);
            } else {
                currentNodeTypeDefinition.properties.push(that.parsePropertyOrChildNodeLine(rawLine));
            }
        } else if (firstCharacterOfRow == '+') {
            if (!isInNodeTypeDefinition) {
                console.error('Cannot parse property definition, if we are not in nodeTypeDefinition: ' + rawLine);
            } else {
                currentNodeTypeDefinition.childNodes.push(that.parsePropertyOrChildNodeLine(rawLine));
            }
        } else {
            if (isInNodeTypeDefinition) {
                /* parse Node Type Options */
                currentNodeTypeDefinition['options'] = that.parseNodeTypeDefinitionOptionsLine(rawLine, currentNodeTypeDefinition["options"]);
            } else {
                console.error('Found a line, which we cannot parse: ' + rawLine);
            }
        }
    });

    if (currentNodeTypeDefinition) {
        nodeTypeDefinitions.push(currentNodeTypeDefinition);
    }

    return nodeTypeDefinitions;
};

CndParser.prototype.parseNodeTypeDefinitionOptionsLine = function(rawLine, options) {
    options = options || {};

    rawLine.split(/\s/).forEach(function(rawPart) {
        rawPart = rawPart.trim();
        if (rawPart != '') {
            options[rawPart] = true;
        }
    });

    return options;
};

CndParser.prototype.parseNodeTypeDefinitionStartLine = function(rawLine) {
    var nodeTypeDefinition = {
        "options": {},
        "properties": [],
        "childNodes": []
    };

    var typeName = rawLine.match(/^\[(.+)\]/)[1];
    typeName = this.stripQuotesFromIdentifier(typeName);
    var superTypes = this.matchCommaSeparatedIdentifiers((rawLine.match(/^\[.+\] >(.*)$/) || ['', ''])[1])[0];
    if (superTypes.length == 0) {
        superTypes = ["nt:base"];
    }

    nodeTypeDefinition["namespacedName"] = typeName;
    nodeTypeDefinition["localName"] = this.getLocalNameFromNamespacedName(typeName);
    nodeTypeDefinition["namespace"] = this.getNamespaceFromNamespacedName(typeName);
    nodeTypeDefinition["superTypes"] = superTypes;

    return nodeTypeDefinition;
};

CndParser.prototype.getNamespaceFromNamespacedName = function(typeName) {
    if (typeName.indexOf(':') == -1) {
        return '';
    }

    return typeName.replace(/^([^:]+):(.+)$/, '$1');
};

CndParser.prototype.getLocalNameFromNamespacedName = function(typeName) {
    if (typeName.indexOf(':') == -1) {
        return typeName;
    }

    return typeName.replace(/^([^:]+):(.+)$/, '$2');
};

CndParser.prototype.stripQuotesFromIdentifier = function(identifier) {
    return identifier.replace(/^(')(.+)(')$/, '$2');
};

CndParser.prototype.parsePropertyOrChildNodeLine = function(rawLine) {
    var propertyDefinition = {
        "options": {}
    };

    rawLine = rawLine.replace(/^[-\+]\s*/, '');
    var identifierMatch = this.matchIdentifier(rawLine);

    propertyDefinition["namespacedName"] = identifierMatch[0];
    propertyDefinition["localName"] = this.getLocalNameFromNamespacedName(propertyDefinition["namespacedName"]);
    propertyDefinition["namespace"] = this.getNamespaceFromNamespacedName(propertyDefinition["namespacedName"]);

    var propertyOptionsLine = identifierMatch[1].trim();
    var typeMatch = propertyOptionsLine.match(/^\(([^\)]+)\)(.*)$/);
    if (typeMatch) {
        var typesMatch = this.matchCommaSeparatedIdentifiers(typeMatch[1]);
        if (typesMatch) {
            propertyDefinition["types"] = typesMatch[0];
        } else {
            propertyDefinition["types"] = [];
        }
        propertyOptionsLine = typeMatch[2].trim();
    }

    /* FIXME: add parsing for default values and constraints */

    propertyDefinition["options"] = this.parseNodeTypeDefinitionOptionsLine(propertyOptionsLine, propertyDefinition.options);

    return propertyDefinition;
};

CndParser.prototype.matchIdentifier = function(rawLine) {
    rawLine = rawLine.trim();
    var identifierWithQuotesMatch = rawLine.match(/^'([^']+)'(.*)$/);
    var identifierWithoutQuotesMatch = rawLine.match(/^([^\s\,]+)(.*)$/);
    if (identifierWithQuotesMatch) {
        return [identifierWithQuotesMatch[1], identifierWithQuotesMatch[2].trim()];
    }

    if (identifierWithoutQuotesMatch) {
        return [identifierWithoutQuotesMatch[1], identifierWithoutQuotesMatch[2].trim()];
    }

    return null;
};

CndParser.prototype.matchCommaSeparatedIdentifiers = function(rawLine) {
    rawLine = rawLine.trim();
    var currentMatch = this.matchIdentifier(rawLine);
    var identifiers = [];

    if (currentMatch) {
        identifiers.push(currentMatch[0]);
        rawLine = currentMatch[1].trim();
    }

    while (rawLine.substr(0, 1) == ',') {
        rawLine = rawLine.substr(1).trim();
        currentMatch = this.matchIdentifier(rawLine);
        if (currentMatch) {
            identifiers.push(currentMatch[0]);
            rawLine = currentMatch[1].trim();
        }
    }

    return [identifiers, rawLine];
};

module.exports = {
    "parseString": function(cndString) {
        return new CndParser(cndString);
    },
    "CndParser": CndParser
};