<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PracticeRequestStatusChangeEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */

    public int $userID;
    public int $requestID;
    public string $statusCode;
    public string $statusName;
    public string $text;

    public function __construct(int $userID, int $requestID, string $statusCode, string $statusName, string $text)
    {
        $this->userID = $userID;
        $this->requestID = $requestID;
        $this->statusCode = $statusCode;
        $this->statusName = $statusName;
        $this->text = $text;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('Notifications.'.$this->userID),
        ];
    }
}
