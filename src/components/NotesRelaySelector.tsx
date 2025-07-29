import { useState } from 'react';
import { Check, ChevronsUpDown, Wifi, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppContext } from "@/hooks/useAppContext";

interface NotesRelaySelectorProps {
  selectedRelay?: string;
  onSelectionChange: (relay?: string) => void;
  className?: string;
  placeholder?: string;
}

export function NotesRelaySelector(props: NotesRelaySelectorProps) {
  const { 
    selectedRelay, 
    onSelectionChange, 
    className, 
    placeholder = "Choose a relay to search..."
  } = props;
  
  const { config, presetRelays = [] } = useAppContext();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Function to normalize relay URL by adding wss:// if no protocol is present
  const normalizeRelayUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return trimmed;
    
    // Check if it already has a protocol
    if (trimmed.includes('://')) {
      return trimmed;
    }
    
    // Add wss:// prefix
    return `wss://${trimmed}`;
  };

  // Check if input value looks like a valid relay URL
  const isValidRelayInput = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    
    // Basic validation - should contain at least a domain-like structure
    const normalized = normalizeRelayUrl(trimmed);
    try {
      new URL(normalized);
      return true;
    } catch {
      return false;
    }
  };

  // Handle selecting a relay
  const handleSelectRelay = (url: string) => {
    const normalizedUrl = normalizeRelayUrl(url);
    onSelectionChange(normalizedUrl);
    setInputValue("");
    setOpen(false);
  };

  // Handle resetting to default (current relay)
  const handleReset = () => {
    onSelectionChange(undefined);
    setOpen(false);
  };

  // Get available preset relays (including current relay)
  const availablePresetRelays = presetRelays.filter(relay => 
    !inputValue || 
    relay.name.toLowerCase().includes(inputValue.toLowerCase()) ||
    relay.url.toLowerCase().includes(inputValue.toLowerCase())
  );

  const getRelayDisplayName = (url: string): string => {
    const preset = presetRelays.find(relay => relay.url === url);
    return preset ? preset.name : url.replace(/^wss?:\/\//, '');
  };

  const currentRelayName = getRelayDisplayName(config.relayUrl);
  const selectedRelayName = selectedRelay ? getRelayDisplayName(selectedRelay) : currentRelayName;
  const isUsingCustomRelay = selectedRelay && selectedRelay !== config.relayUrl;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Current selection display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-medium">Searching:</span>{' '}
            <span className={isUsingCustomRelay ? "text-blue-600 font-medium" : "text-muted-foreground"}>
              {selectedRelayName}
            </span>
            {!isUsingCustomRelay && (
              <span className="text-xs text-muted-foreground ml-1">(default)</span>
            )}
          </span>
        </div>
        {isUsingCustomRelay && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-auto p-1"
            title="Reset to default relay"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Relay selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              <span className="truncate">{placeholder}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput 
              placeholder="Search relays or type URL..." 
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>
                {inputValue && isValidRelayInput(inputValue) ? (
                  <CommandItem
                    onSelect={() => handleSelectRelay(inputValue)}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">Use custom relay</span>
                      <span className="text-xs text-muted-foreground">
                        {normalizeRelayUrl(inputValue)}
                      </span>
                    </div>
                  </CommandItem>
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {inputValue ? "Invalid relay URL" : "No relay found."}
                  </div>
                )}
              </CommandEmpty>
              
              {availablePresetRelays.length > 0 && (
                <CommandGroup heading="Available Relays">
                  {availablePresetRelays.map((relay) => (
                    <CommandItem
                      key={relay.url}
                      value={relay.url}
                      onSelect={() => handleSelectRelay(relay.url)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedRelay === relay.url ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{relay.name}</span>
                        <span className="text-xs text-muted-foreground">{relay.url}</span>
                        {relay.url === config.relayUrl && (
                          <span className="text-xs text-blue-600">Current default</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {inputValue && isValidRelayInput(inputValue) && (
                <CommandGroup heading="Custom Relay">
                  <CommandItem
                    onSelect={() => handleSelectRelay(inputValue)}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">Use custom relay</span>
                      <span className="text-xs text-muted-foreground">
                        {normalizeRelayUrl(inputValue)}
                      </span>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="text-xs text-muted-foreground">
        Choose a specific relay to search for your notes. Different relays may have different historical data.
      </div>
    </div>
  );
}