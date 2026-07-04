<?php

namespace App\Events;

use App\Models\PracticeGroupMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSentEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */

    public string $groupID;
    public PracticeGroupMessage $message;
    public $senderInfo;

    public function __construct(string $groupID, PracticeGroupMessage $message, $senderInfo)
    {
        $this->groupID = $groupID;
        $this->message = $message;
        $this->senderInfo = $senderInfo;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('Group.'.$this->groupID),
        ];
    }

    public function broadcastWith(): array {
        $messageArray = $this->message->toArray();

        $messageArray['file_download_url'] = $this->message->file_path
            ? route('group.messages.download', ['id' => $this->message->id])
            : null;

        return [
            'groupID'    => $this->groupID,
            'message'    => $messageArray,
            'senderInfo' => $this->senderInfo
        ];
    }
}
