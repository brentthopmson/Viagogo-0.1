export interface User {
  sn: string;
  userId: string;
  admin: string;
  senderName: string;
  senderEmail: string;
  userPlatform: string;
  timestamp: string;
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  ticketId: string;
  seatNumbers: string;
  transferringSeatNumbers?: string;
  coverImage: string;
  eventName: string;
  dateTime: string;
  doorTime: string;
  venue: string;
  location: string;
  section: string;
  sectionNo: string;
  row: string;
  ageRestriction: string;
  description: string;
  terms: string;
  eventStatus: string;
  ticketStatus: string;
  link: string;
  ticketFolderId: string;
  approvalSTAMP: string;
  completedSTAMP: string;
  returnedSTAMP: string;
  route: string;
  titleStatus: string;
  messageStatus: string;
  warningStatus: string;
  systemStatus: string;
  percentageStatus: string;
  adminStatus: string;
  adminSMSStatus: string;
}

export interface Ticket {
  sn: string;
  admin: string;
  ticketId: string;
  coverImage: string;
  eventName: string;
  dateTime: string;
  doorTime: string;
  venue: string;
  location: string;
  section: string;
  sectionNo: string;
  row: string;
  ticketFolderId: string;
  ageRestriction: string;
  description: string;
  terms: string;
  newSTAMP: string;
  deletedSTAMP: string;
  eventStatus: string;
  ticketStatus: string;
  platform: string;
  seatNumbers?: string;
  seat?: string;
}


export interface Admin {
  sn: string;
  adminId: string;
  username: string;
  password: string;
  senderName: string;
  senderEmail: string;
  telegramId: string;
  allowedPlatform: string;
  applePayNumber: string;
}