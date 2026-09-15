import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function ScannerModal({ isOpen, onClose }) {
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const scanner = new Html5QrcodeScanner("reader", {
            qrbox: { width: 250, height: 250 },
            fps: 5,
        });

        scanner.render(async (decodedText) => {
            // Pause scanning while processing
            scanner.pause();
            setLoading(true);
            setError('');
            
            try {
                const token = localStorage.getItem('token');
                const res = await axios.post('http://localhost:5000/api/admin/scan', {
                    registrationId: decodedText
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                setScanResult({
                    success: true,
                    message: res.data.message,
                    student: res.data.student,
                    event: res.data.event
                });
            } catch (err) {
                setScanResult({
                    success: false,
                    message: err.response?.data?.error || 'Invalid QR Code / Scan Failed'
                });
            } finally {
                setLoading(false);
                // Resume scanning after 3 seconds so the admin can see the result
                setTimeout(() => {
                    setScanResult(null);
                    scanner.resume();
                }, 3000);
            }
        }, (errorMessage) => {
            // parse errors are normal (no qr code found in frame)
        });

        return () => {
            scanner.clear().catch(console.error);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#121212] border border-white/10 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative"
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl font-bold transition"
                >
                    &times;
                </button>
                
                <h2 className="text-2xl font-bold mb-6 text-center text-white">Scan Attendee Ticket</h2>
                
                <div className="bg-white rounded-xl overflow-hidden p-2 text-black mb-6">
                    <div id="reader" className="w-full"></div>
                </div>

                {loading && (
                    <div className="text-center text-blue-400 font-bold animate-pulse">
                        Verifying Ticket...
                    </div>
                )}

                {scanResult && (
                    <div className={`p-4 rounded-xl border ${scanResult.success ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-red-500/20 border-red-500/50 text-red-300'} text-center`}>
                        <p className="font-bold text-lg mb-1">{scanResult.message}</p>
                        {scanResult.success && (
                            <p className="text-sm">
                                {scanResult.student} &bull; {scanResult.event}
                            </p>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
