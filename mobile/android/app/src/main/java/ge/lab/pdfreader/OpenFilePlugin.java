package ge.lab.pdfreader;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/** Hands PDFs that Android opens with this app ("Open with", "Share to") to the web reader. */
@CapacitorPlugin(name = "OpenFile")
public class OpenFilePlugin extends Plugin {
    private JSObject pending = null;

    @Override
    public void load() {
        pending = read(getActivity().getIntent());
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        JSObject file = read(intent);
        if (file != null) notifyListeners("file", file, true);
    }

    @PluginMethod
    public void getPending(PluginCall call) {
        JSObject result = pending != null ? pending : new JSObject();
        pending = null;
        call.resolve(result);
    }

    private JSObject read(Intent intent) {
        if (intent == null) return null;
        Uri uri = null;
        String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action)) {
            uri = intent.getData();
        } else if (Intent.ACTION_SEND.equals(action)) {
            uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        }
        if (uri == null) return null;
        try (InputStream in = getContext().getContentResolver().openInputStream(uri)) {
            if (in == null) return null;
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[65536];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            JSObject file = new JSObject();
            file.put("name", displayName(uri));
            file.put("data", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
            intent.setAction(null); // handled: don't open it again after a rotation
            return file;
        } catch (Exception e) {
            return null;
        }
    }

    private String displayName(Uri uri) {
        String name = null;
        try (Cursor c = getContext().getContentResolver().query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (c != null && c.moveToFirst()) name = c.getString(0);
        } catch (Exception ignored) {
        }
        if (name == null) name = uri.getLastPathSegment();
        if (name == null || name.isEmpty()) name = "document.pdf";
        return name;
    }
}
