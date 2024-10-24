import { NextApiRequest, NextApiResponse } from 'next';
import ipRangeCheck from 'ip-range-check';

// List of allowed IPs and subnets
const allowedIPs = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.156.11',
  '77.75.156.35',
  '77.75.154.128/25',
  '2a02:5180::/32',
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!clientIP || !ipRangeCheck(clientIP as string, allowedIPs)) {
    return res.status(403).json({ error: 'Forbidden: IP not allowed' });
  }

  if (req.method === 'POST') {
    console.log('Received POST data:', req.body);
    res.status(200).json({ message: 'Data logged successfully' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
