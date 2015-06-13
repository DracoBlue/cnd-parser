var assert = require("assert");
var cndParser = require('./../src/');
var fs = require('fs');

describe('Parse Test File', function(){

    it('works with small testfile', function(done){
       var cnd = cndParser.parseString(fs.readFileSync(__dirname + '/smallFile.cnd').toString());
        console.log(JSON.stringify(cnd.getNodeTypes(), null, 4));

        assert.equal(cnd.getNodeTypes().length, 2);

           cnd.getNodeTypes().forEach(function(nodeType) {
              if (nodeType.localName == "NodeType") {
                  assert.equal(nodeType.superTypes.join('|'), 'ns:ParentType1|ns:ParentType2');
              } else {
                  assert.equal(nodeType.superTypes.join('|'), 'mix:referenceable');

              }
           });

        done();
    });

    it('matches Identifier/commaSeparatedIdentifiers', function(done){
        var cnd = cndParser.parseString('<ns = \'http://namespace.com/ns\'>');
        var matchIdentifier = null;
        var matchCommaIdentifiers = null;

        matchIdentifier = cnd.matchIdentifier('key:hans multiple hans23');
        assert.ok(matchIdentifier);
        assert.equal(matchIdentifier[0], 'key:hans');
        assert.equal(matchIdentifier[1], 'multiple hans23');

        matchIdentifier = cnd.matchIdentifier('\'key:hans\' multiple hans23');
        assert.ok(matchIdentifier);
        assert.equal(matchIdentifier[0], 'key:hans');
        assert.equal(matchIdentifier[1], 'multiple hans23');

        matchCommaIdentifiers = cnd.matchCommaSeparatedIdentifiers('key:hans, hans3 hans23 multiple');
        assert.ok(matchCommaIdentifiers);
        assert.equal(matchCommaIdentifiers[0].join('|'), 'key:hans|hans3');
        assert.equal(matchCommaIdentifiers[1], 'hans23 multiple');

        matchCommaIdentifiers = cnd.matchCommaSeparatedIdentifiers('\'key:hans\', hans3 hans23 multiple');
        assert.ok(matchCommaIdentifiers);
        assert.equal(matchCommaIdentifiers[0].join('|'), 'key:hans|hans3');
        assert.equal(matchCommaIdentifiers[1], 'hans23 multiple');

        matchCommaIdentifiers = cnd.matchCommaSeparatedIdentifiers('\'key:hans\', \'hans3\' hans23 multiple');
        assert.ok(matchCommaIdentifiers);
        assert.equal(matchCommaIdentifiers[0].join('|'), 'key:hans|hans3');
        assert.equal(matchCommaIdentifiers[1], 'hans23 multiple');


        matchCommaIdentifiers = cnd.matchCommaSeparatedIdentifiers('\'key:hans\', \'hans3\' \'hans23\' multiple');
        assert.ok(matchCommaIdentifiers);
        assert.equal(matchCommaIdentifiers[0].join('|'), 'key:hans|hans3');
        assert.equal(matchCommaIdentifiers[1], '\'hans23\' multiple');

        done();
    });

    it('parses child nodes', function(done){
        var cnd = cndParser.parseString('<ns = \'http://namespace.com/ns\'>');
        var childNode = cnd.parsePropertyOrChildNodeLine('+ ns:node (ns:reqType1, ns:reqType2) mandatory autocreated protected multiple version');
        assert.ok(childNode);
        assert.ok(childNode.options.mandatory);
        assert.ok(childNode.options.autocreated);
        assert.ok(childNode.options.protected);
        assert.ok(childNode.options.multiple);
        assert.ok(childNode.options.version);
        assert.equal(childNode.types.join('|'), 'ns:reqType1|ns:reqType2');
        assert.equal(childNode.namespacedName, 'ns:node');
        assert.equal(childNode.localName, 'node');
        assert.equal(childNode.namespace, 'ns');
        done();
    });

    it('parses properties', function(done){
        var cnd = cndParser.parseString('<ns = \'http://namespace.com/ns\'>');
        var propertyNode = cnd.parsePropertyOrChildNodeLine('- ns:node (ns:reqType1) mandatory autocreated protected multiple version');
        assert.ok(propertyNode);
        assert.ok(propertyNode.options.mandatory);
        assert.ok(propertyNode.options.autocreated);
        assert.ok(propertyNode.options.protected);
        assert.ok(propertyNode.options.multiple);
        assert.ok(propertyNode.options.version);
        assert.equal(propertyNode.types.join('|'), 'ns:reqType1');
        assert.equal(propertyNode.namespacedName, 'ns:node');
        assert.equal(propertyNode.localName, 'node');
        assert.equal(propertyNode.namespace, 'ns');
        done();
    });
});