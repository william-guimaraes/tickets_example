const express = require("express")
const axios = require("axios")
const jwt = require("jsonwebtoken") 
const jwksClient = require("jwks-rsa")

const { ZENDESK_SUBDOMAIN, ZENDESK_CREDENTIALS } = process.env;
const router = express.Router()

const jwksClientInstance = jwksClient({
    jwksUri: `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/help_center/integration/keys.json`
})

const getPublicKeyFromJwks = async decodedToken => {
    const kid = decodedToken.header.kid
    const signingKey = await jwksClientInstance.getSigningKey(kid)
    return signingKey.rsaPublicKey
}

const verifyToken = async token => {
    const publicKey = await getPublicKeyFromJwks(
      jwt.decode(token, { complete: true })
    )
    return jwt.verify(token, publicKey)
}

router.get('/', async (req,res) => {
    const token = req.headers.authorization
    const tokenResult = await verifyToken(token)
    const userId = tokenResult.userId
    
    const userURL = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/users/${userId}`
    const userResponse = await axios.get(userURL, {
        headers: {
            'Authorization': `Basic ${ZENDESK_CREDENTIALS}`
        }
    })
    const user = userResponse.data.user
    const ticketRestriction = user.ticket_restriction

    const requestedTicketsURL = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/users/${userId}/tickets/requested`
    const requestedResponse = await axios.get(requestedTicketsURL, {
        headers: {
            'Authorization': `Basic ${ZENDESK_CREDENTIALS}`
        }
    })
    const ccdTicketsURL = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/users/${userId}/tickets/ccd`
    const ccdResponse = await axios.get(ccdTicketsURL, {
        headers: {
            'Authorization': `Basic ${ZENDESK_CREDENTIALS}`
        }
    })
    
    if (ticketRestriction !== 'organization') {
        return res.json({ 
            requested: requestedResponse.data,
            ccd: ccdResponse.data
         })
    }

    const organizationTicketsURL = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/organizations/${user.organization_id}/tickets`
    const organizationResponse = await axios.get(organizationTicketsURL, {
        headers: {
            'Authorization': `Basic ${ZENDESK_CREDENTIALS}`
        }
    })
    return res.json({ 
        requested: requestedResponse.data,
        ccd: ccdResponse.data,
        organization: organizationResponse.data
     })
})

exports.router = router
