'use client';

import React, { useState, useEffect, JSX } from 'react';

interface CountdownTimerProps {
    targetDate: string;
    title: string;
    subtitle: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, title, subtitle }) => {
    const [mounted, setMounted] = useState(false);
    const [timeLeft, setTimeLeft] = useState<Record<string, number>>({});

    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft: Record<string, number> = {};

        if (difference > 0) {
            timeLeft = {
                Days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                Hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                Minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                Seconds: Math.floor((difference % (1000 * 60)) / 1000),
            };
        }

        return timeLeft;
    };

    useEffect(() => {
        // Set mounted to true on client-side only
        setMounted(true);
        // Calculate initial time
        setTimeLeft(calculateTimeLeft());

        // Update timer every second
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const timerComponents: JSX.Element[] = [];

    // Only render timer components after component is mounted (client-side)
    if (mounted) {
        Object.keys(timeLeft).forEach((interval) => {
            const value = timeLeft[interval];
            // Don't render if value is not a number
            if (typeof value !== 'number') return;

            timerComponents.push(
                <div key={interval} className="text-center p-2">
                    <div className="text-3xl md:text-5xl font-bold text-white tabular-nums">
                        {String(value).padStart(2, '0')}
                    </div>
                    <div className="text-xs md:text-sm uppercase text-gray-300 tracking-wider">{interval}</div>
                </div>
            );
        });
    } else {
        // Show placeholder during SSR to prevent hydration mismatch
        timerComponents.push(
            <div key="placeholder" className="text-center p-2">
                <div className="text-3xl md:text-5xl font-bold text-white tabular-nums">
                    --
                </div>
                <div className="text-xs md:text-sm uppercase text-gray-300 tracking-wider">Loading</div>
            </div>
        );
    }

    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-300 mb-6">{subtitle}</p>
            {timerComponents.length ? (
                <div className="flex justify-center items-center gap-2 md:gap-4">
                    {timerComponents}
                </div>
            ) : (
                <div className="text-2xl font-bold text-green-400">The event is live!</div>
            )}
        </div>
    );
};