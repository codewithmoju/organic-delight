package com.stocksuite.inventory;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Initializes the Bridge
    this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
      // Additional plugins would be added here
    }});
  }

  @Override
  public void onBackPressed() {
    // Handle back button for better UX
    if (!bridge.launchIntent(getIntent())) {
      super.onBackPressed();
    }
  }
}