'use client';

import React, { useState, useEffect, JSX } from 'react';

interface CountdownTimerProps {
    targetDate: string;
    title: string;
    subtitle: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, title, subtitle }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                Days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                Hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                Minutes: Math.floor((difference / 1000 / 60) % 60),
                Seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents: JSX.Element[] = [];

    Object.keys(timeLeft).forEach((interval) => {
        const value = timeLeft[interval as keyof typeof timeLeft];
        // Don't render if value is not a number or is 0 for days/hours/mins unless it's the only thing left
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