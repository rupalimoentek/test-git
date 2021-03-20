var range = require('lodash/range');
var crypto = require('crypto');
var moment = require('moment');

module.exports = {
    // Uservoice Single Sign On 
    get: function(user) {
        var mode = 'AES-128-CBC'
        var ssoKey = 'a0267037e9a4e10ea0e792b5a386d4b8'
        var accountKey = 'convirza'
        var initVector = 'OpenSSL for Ruby'

        user = new Buffer(JSON.stringify(user))
        var iv = new Buffer(initVector)

        range(0, 16).forEach(function(i) {
            user[i] ^= iv[i]
        })

        var saltedHash = crypto
            .createHash('sha1')
            .update((ssoKey + accountKey), 'utf-8')
            .digest()
            .slice(0, 16)

        var padLen = 16 - user.length % 16

        range(0, padLen).forEach(function(i) {
            user += String.fromCharCode(padLen)
        })

        var cipher = crypto.createCipheriv(mode, saltedHash, iv)
        cipher.setAutoPadding(false)
        var token = cipher.update(new Buffer(user, 'utf-8'), 'utf-8')
        var encoded = encodeURIComponent(token.toString('base64'))
        return encoded
    }
}

    // // USAGE
    // import uservoiceSSO from './uservoiceSSO'
    // const encoded = uservoiceSSO({
    // avatar_url
    // , display_name
    // , email
    // , expires
    // , guid
    // , trusted
    // , url
    // })
    // res.redirect(`https://foo.bar?sso=${encoded}`) // express res object