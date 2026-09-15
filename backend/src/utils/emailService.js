const nodemailer = require('nodemailer');
const qrcode = require('qrcode');

// Set up the transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this based on your provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendConfirmationEmail = async (toEmail, studentName, eventTitle, registrationId, date, venue) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('⚠️ EMAIL_USER or EMAIL_PASS not set. Skipping real email dispatch.');
            return true; 
        }

        // Generate QR code as Base64 Data URI
        const qrCodeDataURI = await qrcode.toDataURL(registrationId);
        const qrCodeBase64 = qrCodeDataURI.split(',')[1];

        const mailOptions = {
            from: `"Infosys Events" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `🎟️ Ticket Confirmed: ${eventTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">Registration Confirmed!</h1>
                    </div>
                    <div style="padding: 20px; background-color: #f8fafc;">
                        <p style="font-size: 16px; color: #334155;">Hi <strong>${studentName}</strong>,</p>
                        <p style="font-size: 16px; color: #334155;">You are successfully registered for <strong>${eventTitle}</strong>.</p>
                        
                        <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${new Date(date).toDateString()}</p>
                            <p style="margin: 5px 0;"><strong>📍 Venue:</strong> ${venue}</p>
                            <p style="margin: 5px 0;"><strong>🎫 Registration ID:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${registrationId}</span></p>
                        </div>
                        
                        <div style="text-align: center; margin: 20px 0;">
                            <img src="cid:qrcode" alt="Registration QR Code" style="width: 200px; height: 200px;" />
                        </div>
                        <p style="font-size: 14px; color: #64748b; text-align: center;">Please present this QR code at the venue for check-in.</p>
                    </div>
                    <div style="background-color: #1e293b; color: #94a3b8; padding: 15px; text-align: center; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} Infosys Intelligent Event Platform
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: 'qrcode.png',
                    content: qrCodeBase64,
                    encoding: 'base64',
                    cid: 'qrcode'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${toEmail}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = { sendConfirmationEmail };
