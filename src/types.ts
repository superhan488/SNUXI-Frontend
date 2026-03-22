export interface RoomData {
  roomId: number;
  departure: string;
  destination: string;
  departureTime: string;
  currentCapacity: number;
  minCapacity: number;
  maxCapacity: number;
  hostName: string;
  estimatedFee: number;
  status: string; // 서버의 status 필드
}
