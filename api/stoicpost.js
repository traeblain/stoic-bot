require('dotenv').config()
const base = require('airtable').base('appYOXxruKPof8nRx')

const quoteBase = []

const postQuote = async (dev) => {
  const selectedQuote = base('Quotes').select({
    maxRecords: 1000
  }).eachPage(page = (records, fetchNextPage) => {
    records.forEach((record) => {
      quoteBase.push({
        quote: record.get('Quote'),
        cite: record.get('Cite'),
        count: record.get('PostCount'),
        id: record.id
      })
    })
    fetchNextPage()
  }).then(result => {
    const total = quoteBase.length
    const quoteOptions = generateRandoms(0, total, 10, true)
    console.log('Random #s:', quoteOptions)
    const quotes = quoteOptions
      .map( s => quoteBase[s] )
      .sort( (a, b) => { return a.count - b.count })
    base('Quotes').update([
      {
        "id": quotes[0].id,
        "fields": {
          "PostCount": quotes[0].count + 1
        }
      }
    ]).catch((err) => {
      console.error(err)
    })
    const status = `${quotes[0].quote}\n\n\t— ${quotes[0].cite}\n\n#Stoic #Stoicism #${quotes[0].cite.replace(/\s+/g, '')}`
    if (status.length > 500) {
      status = status.substring(0, status.lastIndexOf(' '))
    }
    console.log('Generated Status: ', status)
    const postObject = {
      status: status
    }
    if (dev) {
      const now = new Date()
      now.setDate(now.getDate() + 14)
      postObject.schedule_at = now.toISOString()
    }
    const mastPost = fetch('https://botsin.space/api/v1/statuses', {
      method: "post",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.MASTODON_KEY
      },
      body: JSON.stringify(postObject)
    }).then(response => {
      if(!response.ok) {
        throw new Error('Could not post to Mastodon.', response)
      }
      console.log('Successful post! ', response)
      base('Quotes').update([
        {
          "id": quotes[0].id,
          "fields": {
            "PostCount": quotes[0].count + 1
          }
        }
      ]).catch((err) => {
        console.error(err)
      })
      return quotes[0]
    }).catch((err) => {
      return err
    })
    return mastPost
  })
  console.log('Mastodon Response: ', selectedQuote)
  return selectedQuote
}

const generateRandoms = (min, max, numOfRandoms, unique) => {
  var getRandom = function(x, y){
    return Math.floor(Math.random() * (x - y + 1) + y)
  }
  var randoms = []
  while(randoms.length<numOfRandoms){
    var random = getRandom(min, max)
    if(randoms.indexOf(random)==-1||!unique){
      randoms.push(random)
    }
  }
  console.log('Internal Random #s ', randoms)
  return randoms
}

module.exports = async (req, res) => {
  const { authorization, dev } = req.headers
  if (authorization === `Bearer ${process.env.SUPER_SECRET_KEY}`) {
    const data = await postQuote(dev)
    console.log(data)
    res.setHeader('content-type', 'application/json')
    res.status(200).json({
      postedQuote: data,
      success: true
    })
  } else {
    res.status(401).json({
      success: false,
      body: 'Authorization code invalid.'
    })
  }
}
