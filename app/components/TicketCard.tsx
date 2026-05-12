"use client";

import React from 'react';
import { Ticket } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMapMarkerAlt, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

import Link from 'next/link';

interface TicketCardProps {
    ticket: Ticket;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
    return (
        <Link href={`/secure/myaccount/tickets/${ticket.ticketId}`}>
            <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-4">
                <div className="flex flex-col md:flex-row">
                    {/* Event Image */}
                    <div className="relative w-full md:w-48 h-32 md:h-auto bg-gray-100">
                        {ticket.coverImage ? (
                            <img 
                                src={ticket.coverImage} 
                                alt={ticket.eventName} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-[#001B41] mb-2">{ticket.eventName}</h3>
                                <div className="flex flex-col space-y-1">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="w-4 mr-2 text-gray-400" />
                                        <span>{ticket.dateTime}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 mr-2 text-gray-400" />
                                        <span>{ticket.venue}, {ticket.location}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:block">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#89CF28]/10 text-[#89CF28] uppercase tracking-wider">
                                    {ticket.ticketStatus || 'Confirmed'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                            <div className="text-sm text-gray-500">
                                <span className="font-bold">Sec {ticket.section}</span>, Row {ticket.row}
                            </div>
                            <div className="text-[#89CF28] font-bold flex items-center hover:underline">
                                View Ticket <FontAwesomeIcon icon={faChevronRight} className="ml-2 text-xs" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default TicketCard;
