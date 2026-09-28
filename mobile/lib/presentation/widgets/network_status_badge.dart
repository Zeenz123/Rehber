import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:rehber/core/network/network_state_manager.dart';

class NetworkStatusBadge extends StatelessWidget {
  final VoidCallback? onTap;

  const NetworkStatusBadge({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Consumer<NetworkStateManager>(
      builder: (context, netState, _) {
        final state = netState.currentState;
        Color bg;
        Color fg;
        IconData icon;
        String text;

        switch (state) {
          case RehberNetworkState.online:
            bg = const Color(0xFFE8F5E9);
            fg = const Color(0xFF2E7D32);
            icon = Icons.wifi;
            text = 'ONLINE (${netState.lastLatencyMs}ms)';
            break;
          case RehberNetworkState.lowBandwidth:
            bg = const Color(0xFFFFF8E1);
            fg = const Color(0xFFF57F17);
            icon = Icons.network_cell;
            text = 'LOW-BW (${netState.lastLatencyMs}ms)';
            break;
          case RehberNetworkState.offline:
            bg = const Color(0xFFECEFF1);
            fg = const Color(0xFF455A64);
            icon = Icons.cloud_off;
            text = 'OFFLINE (LOCAL DB)';
            break;
          case RehberNetworkState.messageFallback:
            bg = const Color(0xFFEDE7F6);
            fg = const Color(0xFF512DA8);
            icon = Icons.sms;
            text = 'CELLULAR / SMS FALLBACK';
            break;
        }

        return GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(16),
              border: Border.parseBorder(
                Border.all(
                  color: fg.withOpacity(0.4),
                  width: 1.2,
                ),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 14, color: fg),
                const SizedBox(width: 5),
                Text(
                  text,
                  style: TextStyle(
                    color: fg,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.3,
                  ),
                ),
                if (netState.isManualOverride) ...[
                  const SizedBox(width: 4),
                  Icon(Icons.tune, size: 12, color: fg),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
