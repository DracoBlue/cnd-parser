# cnd-parser

* Latest Release: [![GitHub version](https://badge.fury.io/gh/DracoBlue%2Fcnd-parser.png)](https://github.com/DracoBlue/cnd-parser/releases)
* Build-Status: [![Build Status](https://travis-ci.org/DracoBlue/cnd-parser.png?branch=master)](https://travis-ci.org/DracoBlue/cnd-parser)

cnd-parser is copyright 2015 by DracoBlue <http://dracoblue.net>

## What is cnd-parser?

This is a small (nodejs/browserify) library for parsing CND-Strings (defined in [jsr-170](https://jcp.org/en/jsr/detail?id=170)
and explained at [jackrabbit](http://jackrabbit.apache.org/jcr/node-type-notation.html)).

This implementation doesn't support the full CND-syntax.

## Limitations

* constraints and default values are not supported
* each property and childnode needs to be defined on one row
* shortcuts (like m for multiple) are not supported
* the library does no validation for nodetype, property or childnode options 

## Example

This example:

``` cnd
<ns = 'http://namespace.com/ns'>
[ns:NodeType] > ns:ParentType1, ns:ParentType2
  orderable mixin
  - ex:property (string) primary mandatory autocreated protected multiple version
  + ns:node (ns:reqType1, ns:reqType2) mandatory autocreated protected multiple version
[nt:resource] > mix:referenceable
  - jcr:encoding
  - jcr:mimeType mandatory
  - jcr:data (binary) mandatory
  - jcr:lastModified (date) mandatory ignore
```

can be parsed (in nodejs) like this:

``` js
cnd = cndParser.parseString('/* string here! */');
console.log(JSON.stringify(cnd.getNodeTypes(), null, 4));
```
Output:

``` json
[
    {
        "options": {
            "orderable": true,
            "mixin": true
        },
        "properties": [
            {
                "options": {
                    "primary": true,
                    "mandatory": true,
                    "autocreated": true,
                    "protected": true,
                    "multiple": true,
                    "version": true
                },
                "namespacedName": "ex:property",
                "localName": "property",
                "namespace": "ex",
                "types": [
                    "string"
                ]
            }
        ],
        "childNodes": [
            {
                "options": {
                    "mandatory": true,
                    "autocreated": true,
                    "protected": true,
                    "multiple": true,
                    "version": true
                },
                "namespacedName": "ns:node",
                "localName": "node",
                "namespace": "ns",
                "types": [
                    "ns:reqType1",
                    "ns:reqType2"
                ]
            }
        ],
        "namespacedName": "ns:NodeType",
        "localName": "NodeType",
        "namespace": "ns",
        "superTypes": [
            "ns:ParentType1",
            "ns:ParentType2"
        ]
    },
    {
        "options": {},
        "properties": [
            {
                "options": {},
                "namespacedName": "jcr:encoding",
                "localName": "encoding",
                "namespace": "jcr"
            },
            {
                "options": {
                    "mandatory": true
                },
                "namespacedName": "jcr:mimeType",
                "localName": "mimeType",
                "namespace": "jcr"
            },
            {
                "options": {
                    "mandatory": true
                },
                "namespacedName": "jcr:data",
                "localName": "data",
                "namespace": "jcr",
                "types": [
                    "binary"
                ]
            },
            {
                "options": {
                    "mandatory": true,
                    "ignore": true
                },
                "namespacedName": "jcr:lastModified",
                "localName": "lastModified",
                "namespace": "jcr",
                "types": [
                    "date"
                ]
            }
        ],
        "childNodes": [],
        "namespacedName": "nt:resource",
        "localName": "resource",
        "namespace": "nt",
        "superTypes": [
            "mix:referenceable"
        ]
    }
]
```

## License

The cnd-parser project is licensed under the MIT License. See LICENSE for more information.