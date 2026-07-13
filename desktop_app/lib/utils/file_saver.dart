import 'file_saver_stub.dart'
    if (dart.library.html) 'file_saver_web.dart'
    if (dart.library.io) 'file_saver_non_web.dart';

Future<void> saveBytesOrString(String data, String fileName) async {
  await saveFileImpl(data, fileName);
}
