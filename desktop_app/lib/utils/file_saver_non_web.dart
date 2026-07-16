import 'dart:io';
import 'package:file_picker/file_picker.dart';

Future<void> saveFileImpl(String data, String fileName) async {
  String? outputFile = await FilePicker.saveFile(
    dialogTitle: 'Export File',
    fileName: fileName,
    type: FileType.custom,
    allowedExtensions: [fileName.split('.').last],
  );

  if (outputFile != null) {
    final file = File(outputFile);
    await file.writeAsString(data);
  }
}
