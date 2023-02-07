const temml = require('temml')

module.exports = async (req, res) => {
  const tex = req.body
  console.log(req.body)
  const mathml = temml
    .renderToString(tex, { displayMode: true, xml: true })
    .replace("display=\"block\"", "class=\"mathml\" display=\"block\"")
    .replace("style=\"display:inline-block;\"", "")
  res.setHeader('content-type', 'application/json')
  res.status(200).json({
    title: "Tra.pt Tools Math Processor",
    math: mathml,
    tex: tex
  })
}
