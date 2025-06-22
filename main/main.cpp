#include <iostream>
#include <string>
#include <vector>
#include "zx16sim.h"
using namespace std;

int main(int argc, char* argv[])
{
    if (argc < 2) {
        cerr << "Usage: zx16sim <machine_code_file_name> [-d|--debug]" << endl;
        return 1;
    }

    // Create a simulator instance
    Z16Simulator simulator;
    
    string filename = argv[1];
    bool debugMode = false;

    // Check if optional debug flag is provided
    if (argc > 2) {
        string flag = argv[2];
        if (flag == "-d" || flag == "--debug") {
            debugMode = true;
        }
    }
    
    bool success = false;
    
    // Check if the file is an assembly file or a binary file
    if ((filename.size() >= 4 && filename.substr(filename.size() - 4) == ".asm") ||
    (filename.size() >= 2 && filename.substr(filename.size() - 2) == ".s")) {
        cout << "Loading assembly file: " << filename << endl;
        success = simulator.loadAssembly(filename);
    } else {
        cout << "Loading binary file: " << filename << endl;
        success = simulator.loadBinaryFile(filename, debugMode);
    }
    
    if (!success) {
        cerr << "Failed to load file. Exiting." << endl;
        return 1;
    }
    
    cout << "Starting simulation..." << endl;
    
    // Run the simulator
    try {
        simulator.run(debugMode);
    } catch (const exception& e) {
        cerr << "Error during simulation: " << e.what() << endl;
        return 1;
    }
    
    cout << "Simulation completed successfully." << endl;
    return 0;
}