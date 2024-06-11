const CidrMatcher = require('cidr-matcher');

const whitelist = ['192.168.1.0/24', '10.0.0.0/8', '158.178.243.123/32', '114.10.114.94/32']
const matcher = new CidrMatcher(whitelist)

module.exports = (req, res) => {
  try {
    const ipPengunjung = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`IP ORANG: ${ipPengunjung}`);

    if (matcher.contains(ipPengunjung)) {
      res.status(200).json({
        status: "200",
        developer: "@renkie",
        ip: ipPengunjung,
        message: 'Authorized'
      });
    } else {
      res.status(403).json({
        status: "403",
        developer: "@Renkie",
        ip: ipPengunjung,
        message: 'Not authorized'
      });
    }
  } catch (error) {
    console.error('Error di route /api/ip:', error);
    res.status(500).json({
      ip: null,
      message: 'Internal Server Error'
    });
  }
}
