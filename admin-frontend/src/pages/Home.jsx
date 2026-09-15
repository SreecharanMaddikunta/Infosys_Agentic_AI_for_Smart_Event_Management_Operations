import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
            <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-6xl font-bold max-w-4xl leading-tight mt-10"
            >
                Intelligent Event Management <br />
                <span className="gradient-text">Powered by AI</span>
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-muted-foreground max-w-3xl"
            >
                Welcome to the Infosys Intelligent Event Management platform.
                Experience seamless event scheduling, AI-powered speaker allocation, dynamic venue matching, and complete administrative control.
            </motion.p>
            
            <div className="w-full max-w-2xl mt-12">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-10 rounded-2xl max-w-md mx-auto border-2 border-primary/20"
                >
                    <h2 className="text-3xl font-bold mb-2 capitalize text-primary">Admin Portal</h2>
                    <p className="text-muted-foreground mb-8">Please sign in as an administrator to access the dashboard.</p>
                    
                    <div className="flex flex-col gap-4">
                        <Link 
                            to="/login" 
                            className="bg-primary text-primary-foreground py-3 rounded-xl font-bold text-lg hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                        >
                            Sign In to Admin Portal
                        </Link>
                        <Link 
                            to="/register" 
                            className="border-2 border-border py-3 rounded-xl font-bold text-lg hover:border-primary hover:text-primary transition"
                        >
                            Create Admin Account
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
