#include <stdio.h>

extern "C" int sum(int a, int b) {
    return a + b;
}

extern "C" void hello(int num) {
    printf("hello from C! num = %d\n", num);
}
