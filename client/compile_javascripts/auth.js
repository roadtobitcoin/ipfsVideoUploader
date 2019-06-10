// Load Steem Connect access token to client
const jAvalon = require('javalon')
let url = new URL(window.location.href)
let token = url.searchParams.get('access_token') // Access token for logged in user
let iskeychain = url.searchParams.get('keychain')

async function steem() {
    if (!token) {
        // Not logged in or no access token
        window.setTimeout(function() {
            document.getElementById('loggedInUser').innerHTML = 'You are not logged in!'
            restrict()
        },100)
        return null
    } else if (iskeychain == 'true') {
        // Steem Keychain Login
        let keychainLoginPromise = new Promise((resolve,reject) => {
            axios.get('/auth?access_token=' + token).then((authResponse) => {
                if (authResponse.data.error != null) {
                    alert(authResponse.data.error)
                    document.getElementById('loggedInUser').innerHTML = 'Not authorized'
                    restrict()
                    resolve(null)
                } else {
                    document.getElementById('loggedInUser').innerHTML = 'You are logged in as ' + authResponse.data.user + ' on Steem'
                    retrieveDraft()
                    resolve(authResponse.data.user)
                }
            }).catch((error) => {
                if (error.response.data.error)
                    alert(error.response.data.error)
                else
                    alert(error)
                document.getElementById('loggedInUser').innerHTML = 'Login failed'
                restrict()
                resolve(null)
            })
        })
        let user = await keychainLoginPromise
        return user
    } else {
        // SteemConnect login
        let steemconnectLoginPromise = new Promise((resolve,reject) => {
            let api = steemconnect.Client({ accessToken: token })
            api.me((err,res) => {
                if (err) {
                    alert(err)
                    return resolve(null)
                }
                document.getElementById('loggedInUser').innerHTML = 'You are logged in as ' + res.account.name + ' on Steem'
                axios.get('/checkuser?user=' + res.account.name).then(function(response) {
                    console.log(response)
                    if (response.data.isInWhitelist == false) {
                        restrict()
                        alert('Looks like you do not have access to the uploader!')
                        return resolve(res.account.name)
                    }

                    // Retrieve metadata from draft if any
                    retrieveDraft()
                    resolve(res.account.name)
                })
            })
        })

        let user = await steemconnectLoginPromise
        return user
    }
}

async function avalon() {
    // Verify Avalon login
    let avalonUser = sessionStorage.getItem('OneLoveAvalonUser')
    let avalonKey = sessionStorage.getItem('OneLoveAvalonKey')

    if (!avalonUser || !avalonKey) {
        alert('Error retrieving Avalon login. Please sign in again.')
        return restrict()
    }

    let avalonLoginPromise = new Promise((resolve,reject) => {
        jAvalon.getAccount(avalonUser,(err,result) => {
            if (err) return reject(err)
            let avalonPubKey = jAvalon.privToPub(avalonKey)
            if (result.pub === avalonPubKey) return resolve(true)
            resolve(false)
        })
    })
    
    try {
        let avalonLoginResult = await avalonLoginPromise
        if (avalonLoginResult != true) {
            restrict()
            return alert('Avalon key is invalid! Please login again.')
        }
    } catch (e) {
        restrict()
        return alert('An error occured with Avalon login. Please login again.')
    }

    document.getElementById('loggedInUser').innerHTML += ', and ' + avalonUser + ' on Avalon'
}

function restrict() {
    const toDisable = ['sourcevideo','snapfile','title','description','tags','powerup','postBody','postImgBtn','draftBtn','submitbutton','newLanguageField','chooseSubBtn','uploadSubBtn','thumbnailSwapLink','linkSubmitBtn','newSnap','swapSubmitBtn']
    for (let i = 0; i < toDisable.length; i++) document.getElementById(toDisable[i]).disabled = true
}

function retrieveDraft() {
    let savedTitle = localStorage.getItem('OneLoveTitle')
    let savedDescription = localStorage.getItem('OneLoveDescription')
    let savedTags = localStorage.getItem('OneLoveTags')
    let savedPostBody = localStorage.getItem('OneLovePostBody')

    if (savedTitle != null) {
        document.getElementById('title').value = savedTitle
    }

    if (savedDescription != null) {
        document.getElementById('description').value = savedDescription
    }

    if (savedTags != null) {
        document.getElementById('tags').value = savedTags
    }

    if (savedPostBody != null) {
        document.getElementById('postBody').value = savedPostBody
    }
}

module.exports = {
    steem,
    avalon,
    token,
    iskeychain,
    restrict
}