import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL!);

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // Set a seat hold with TTL (Time To Live in seconds)
  async setSeatHold(
    seatId: string,
    holdToken: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const key = `seat-hold:${seatId}`;
    // NX = only set if key doesn't exist (prevents overwriting existing holds)
    // EX = set expiry in seconds
    const result = await this.client.set(
      key,
      holdToken,
      'EX',
      ttlSeconds,
      'NX',
    );
    return result === 'OK'; // Returns true if hold was created, false if seat already held
  }

  // Get the holdToken for a seat (returns null if no hold exists)
  async getSeatHold(seatId: string): Promise<string | null> {
    const key = `seat-hold:${seatId}`;
    return await this.client.get(key);
  }

  // Delete a seat hold (when booking is completed or cancelled)
  async deleteSeatHold(seatId: string): Promise<void> {
    const key = `seat-hold:${seatId}`;
    await this.client.del(key);
  }

  // Check if a specific holdToken is valid for a seat
  async verifyHoldToken(seatId: string, holdToken: string): Promise<boolean> {
    const storedToken = await this.getSeatHold(seatId);
    return storedToken === holdToken;
  }
}
