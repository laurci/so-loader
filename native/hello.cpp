#include <stdio.h>

extern "C" int sum(int a, int b) {
    return a + b;
}

extern "C" void hello(int a, int b) {
    printf("Hello, world! sum(%d, %d) = %d", a, b, sum(a, b));
}
